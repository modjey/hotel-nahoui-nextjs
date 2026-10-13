import { prisma } from "@/lib/prisma";
import { notifyAdminNewBooking } from "@/lib/notifications";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import {
  BookingConflictError,
  PENDING_BOOKING_TTL_MS,
  generateBookingReference,
  overlapBookingWhere,
  validateBookingDates,
  withRoomLock,
} from "@/lib/bookings";
import { z } from "zod";

const bookingSchema = z.object({
  roomId: z.string(),
  userId: z.string().nullable().optional(),
  guestFirstName: z.string().nullable().optional(),
  guestLastName: z.string().nullable().optional(),
  guestEmail: z.string().email().nullable().optional(),
  guestPhone: z.string().nullable().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().min(1),
  children: z.number().min(0),
  status: z.enum(["CONFIRMED", "PENDING", "CANCELLED"]),
});

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const roomSlug = searchParams.get("roomSlug");

  if (req.method === "GET") {
    const where: any = {};
    if (roomSlug) {
      const room = await prisma.room.findUnique({ where: { slug: roomSlug } });
      if (!room) return fail("Chambre introuvable", 404, "NOT_FOUND");
      where.roomId = room.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
        payment: {
          select: {
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { checkIn: "desc" },
    });

    return ok({ bookings });
  }

  if (req.method === "POST") {
    const parsed = await parseBody(req, bookingSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Vérifier que la chambre existe
    const room = await prisma.room.findUnique({ where: { id: body.roomId } });
    if (!room) return fail("Chambre introuvable", 400, "INVALID_ROOM");

    // Vérifier les dates (les dates passées restent autorisées en admin)
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    const dateError = validateBookingDates(checkIn, checkOut, { allowPast: true });
    if (dateError) return fail(dateError.message, 400, dateError.code);

    // Vérification du chevauchement et création sous verrou de la chambre :
    // deux créations concurrentes ne peuvent pas se croiser.
    let booking;
    try {
      booking = await withRoomLock(body.roomId, async (tx) => {
        const overlapping = await tx.booking.findFirst({
          where: overlapBookingWhere(body.roomId, checkIn, checkOut),
          select: { id: true },
        });
        if (overlapping) throw new BookingConflictError("Cette chambre est déjà réservée pour ces dates");

        return tx.booking.create({
          data: {
            roomId: body.roomId,
            userId: body.userId,
            guestFirstName: body.guestFirstName,
            guestLastName: body.guestLastName,
            guestEmail: body.guestEmail,
            guestPhone: body.guestPhone,
            checkIn,
            checkOut,
            adults: body.adults,
            children: body.children,
            status: body.status,
            reference: generateBookingReference(),
            expiresAt: body.status === "PENDING" ? new Date(Date.now() + PENDING_BOOKING_TTL_MS) : null,
          },
          include: {
            room: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
            payment: {
              select: {
                status: true,
              },
            },
          },
        });
      });
    } catch (e) {
      if (e instanceof BookingConflictError) {
        return fail(e.message, 400, "DATES_UNAVAILABLE");
      }
      throw e;
    }

    await notifyAdminNewBooking({
      reference: booking.reference,
      roomName: booking.room?.name,
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

    return ok({ booking });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST };
