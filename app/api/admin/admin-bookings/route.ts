import { prisma } from "@/lib/prisma";
import { notifyAdminNewBooking, createAdminNotification, notifyGuestBookingStatus } from "@/lib/notifications";
import { ok, fail, withAuth } from "@/lib/auth/api";
import {
  BookingConflictError,
  PENDING_BOOKING_TTL_MS,
  generateBookingReference,
  overlapBookingWhere,
  validateBookingDates,
  withRoomLock,
} from "@/lib/bookings";
import { z } from "zod";

export const runtime = "nodejs";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

const createBookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  guestFirstName: z.string().min(1),
  guestLastName: z.string().min(1),
  guestEmail: z.string().email().optional().nullable(),
  guestPhone: z.string().optional().nullable(),
  reference: z.string().optional(),
  status: z.enum(["PENDING", "CANCELLED"]).default("PENDING"),
});

const handler = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (req.method === "PATCH" && id) {
    try {
      const body = await req.json();
      const parsed = updateBookingSchema.parse(body);

      const existingBooking = await prisma.booking.findUnique({
        where: { id },
        include: { payments: true, user: { select: { email: true } } },
      });

      if (!existingBooking) {
        return fail("Réservation introuvable", 404, "NOT_FOUND");
      }

      if (parsed.status === "CONFIRMED") {
        if (!existingBooking.payments.some((p) => p.status === "SUCCESS")) {
          return fail("Ajoutez un paiement payé avant de confirmer la réservation", 400, "PAYMENT_REQUIRED");
        }
        // La chambre a pu être prise entre-temps : on refuse une confirmation en conflit.
        const conflict = await prisma.booking.findFirst({
          where: overlapBookingWhere(existingBooking.roomId, existingBooking.checkIn, existingBooking.checkOut, {
            excludeBookingId: id,
          }),
          select: { id: true, reference: true },
        });
        if (conflict) {
          return fail(
            `Impossible de confirmer : la chambre est déjà occupée sur ces dates (réservation ${conflict.reference || conflict.id})`,
            409,
            "CONFLICT",
          );
        }
      }

      // Update booking status
      const booking = await prisma.booking.update({
        where: { id },
        data: {
          status: parsed.status,
          // Un PENDING redevient temporaire ; les autres statuts libèrent la chambre.
          expiresAt:
            parsed.status === "PENDING"
              ? new Date(Date.now() + PENDING_BOOKING_TTL_MS)
              : null,
        },
        include: {
          payments: true,
          room: { select: { name: true } },
        },
      });

      // If the booking is cancelled, mark all its successful payments as refunded
      let refunded = false;
      if (parsed.status === "CANCELLED") {
        const result = await prisma.payment.updateMany({
          where: { bookingId: id, status: "SUCCESS" },
          data: { status: "REFUNDED" },
        });
        refunded = result.count > 0;
      }

      if (parsed.status === "CONFIRMED" || parsed.status === "CANCELLED") {
        await createAdminNotification({
          type: parsed.status === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_CANCELLED",
          title: parsed.status === "CONFIRMED" ? "Réservation confirmée" : "Réservation annulée",
          message: `${existingBooking.guestFirstName || ""} ${existingBooking.guestLastName || ""} — réf ${existingBooking.reference || existingBooking.id}`.trim(),
          link: "/admin/bookings",
        });
      }

      // Notification transactionnelle au client (email) : confirmation, annulation ou fin de séjour.
      if (parsed.status === "CONFIRMED" || parsed.status === "CANCELLED" || parsed.status === "COMPLETED") {
        await notifyGuestBookingStatus({
          status: parsed.status,
          reference: existingBooking.reference,
          roomName: booking.room?.name,
          checkIn: existingBooking.checkIn,
          checkOut: existingBooking.checkOut,
          guestFirstName: existingBooking.guestFirstName,
          guestLastName: existingBooking.guestLastName,
          guestEmail: existingBooking.guestEmail || existingBooking.user?.email,
          refunded,
        });
      }

      return ok({ booking });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail("Invalid request body", 400, "INVALID_BODY");
      }
      console.error("Failed to cancel booking:", error);
      return fail("Failed to cancel booking", 500, "CANCEL_FAILED");
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const parsed = createBookingSchema.parse(body);
      const checkInDate = new Date(parsed.checkIn);
      const checkOutDate = new Date(parsed.checkOut);
      const dateError = validateBookingDates(checkInDate, checkOutDate, { allowPast: true });
      if (dateError) return fail(dateError.message, 400, dateError.code);

      const room = await prisma.room.findUnique({ where: { id: parsed.roomId } });
      if (!room) return fail("Chambre introuvable", 404, "ROOM_NOT_FOUND");

      if (parsed.adults + parsed.children > room.maxGuests) {
        return fail(`Cette chambre peut accueillir au maximum ${room.maxGuests} voyageurs`, 400, "TOO_MANY_GUESTS");
      }

      // Chevauchement vérifié et création sous verrou de la chambre.
      const booking = await withRoomLock(room.id, async (tx) => {
        const overlapping = await tx.booking.findFirst({
          where: overlapBookingWhere(room.id, checkInDate, checkOutDate),
          select: { id: true },
        });
        if (overlapping) {
          throw new BookingConflictError("Cette chambre n'est pas disponible pour ces dates");
        }

        return tx.booking.create({
          data: {
            roomId: room.id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            adults: parsed.adults,
            children: parsed.children,
            guestFirstName: parsed.guestFirstName,
            guestLastName: parsed.guestLastName,
            guestEmail: parsed.guestEmail,
            guestPhone: parsed.guestPhone,
            reference: parsed.reference || generateBookingReference(),
            status: parsed.status,
            expiresAt: parsed.status === "PENDING" ? new Date(Date.now() + PENDING_BOOKING_TTL_MS) : null,
          },
        });
      });

      await notifyAdminNewBooking({
        reference: booking.reference,
        roomName: room.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        adults: booking.adults,
        children: booking.children,
        status: booking.status,
        guestFirstName: booking.guestFirstName,
        guestLastName: booking.guestLastName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
      });

      return ok({ booking }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail("Données invalides", 400, "INVALID_BODY");
      }
      if (error instanceof BookingConflictError) {
        return fail(error.message, 409, "CONFLICT");
      }
      console.error("Failed to create booking:", error);
      return fail("Failed to create booking", 500, "CREATE_FAILED");
    }
  }

  if (req.method === "GET") {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { guestFirstName: { contains: search, mode: "insensitive" } },
        { guestLastName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          userId: true,
          roomId: true,
          checkIn: true,
          checkOut: true,
          adults: true,
          children: true,
          status: true,
          createdAt: true,
          guestFirstName: true,
          guestLastName: true,
          guestEmail: true,
          guestPhone: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
          room: { select: { name: true, slug: true } },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              reference: true,
              method: true,
              provider: true,
              dueAt: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ok({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST, handler as PATCH };
