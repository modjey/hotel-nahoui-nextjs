import { prisma } from "@/lib/prisma";
import { notifyAdminNewBooking, notifyGuestBookingStatus } from "@/lib/notifications";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import {
  PENDING_BOOKING_TTL_MS,
  BookingConflictError,
  generateBookingReference,
  generatePaymentReference,
  hasBookingOverlap,
  isTransientDatabaseError,
  nightsBetween,
  overlapBookingWhere,
  validateBookingDates,
  withRoomLock,
} from "@/lib/bookings";
import { getDiscountedPrice } from "@/lib/pricing";

export const runtime = "nodejs";

const createBookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  guestFirstName: z.string().min(1).max(120),
  guestLastName: z.string().min(1).max(120),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(40).optional().nullable(),
});

/**
 * GET /api/bookings
 * Récupère les réservations de l'utilisateur connecté.
 */
export const GET = withAuth(
  async (_req, ctx) => {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId: ctx.session.userId },
        include: {
          room: {
            select: {
              id: true,
              slug: true,
              name: true,
              coverImageUrl: true,
              basePrice: true,
              currency: true,
              location: { select: { name: true, city: true } },
            },
          },
          payments: { orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
        },
        orderBy: { createdAt: "desc" },
      });

      return ok({ bookings });
    } catch (e) {
      console.error("[GET /api/bookings]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  },
);

/**
 * POST /api/bookings
 * Crée une réservation PENDING (15 min) + un paiement PENDING associé.
 * La réservation n'est confirmée qu'après paiement.
 */
export const POST = withAuth(async (req, ctx) => {
  // Anti-abus : 20 créations de réservation par heure et par utilisateur.
  const limit = rateLimit(`booking:${ctx.session.userId}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return fail("Trop de réservations créées. Réessayez plus tard.", 429, "TOO_MANY_REQUESTS");
  }

  const parsed = await parseBody(req, createBookingSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  // Déclarés hors du try pour être utilisables dans le catch (re-vérification
  // de conflit après un aléa transitoire de base de données).
  const checkInDate = new Date(body.checkIn);
  const checkOutDate = new Date(body.checkOut);

  try {
    const dateError = validateBookingDates(checkInDate, checkOutDate);
    if (dateError) return fail(dateError.message, 400, dateError.code);

    const room = await prisma.room.findFirst({
      where: { id: body.roomId, isPublished: true },
      select: { id: true, name: true, basePrice: true, currency: true, discountPercent: true, maxGuests: true },
    });
    if (!room) return fail("Chambre introuvable", 404, "NOT_FOUND");

    const totalGuests = body.adults + body.children;
    if (totalGuests > room.maxGuests) {
      return fail(
        `Cette chambre peut accueillir au maximum ${room.maxGuests} voyageurs`,
        400,
        "TOO_MANY_GUESTS",
      );
    }

    const nights = nightsBetween(checkInDate, checkOutDate);
    const amount = getDiscountedPrice(room.basePrice, room.discountPercent) * nights;
    const expiresAt = new Date(Date.now() + PENDING_BOOKING_TTL_MS);

    const booking = await withRoomLock(room.id, async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: overlapBookingWhere(room.id, checkInDate, checkOutDate),
        select: { id: true },
      });
      if (conflict) throw new BookingConflictError();

      return tx.booking.create({
        data: {
          roomId: room.id,
          userId: ctx.session.userId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults: body.adults,
          children: body.children,
          guestFirstName: body.guestFirstName,
          guestLastName: body.guestLastName,
          guestEmail: body.guestEmail,
          guestPhone: body.guestPhone ?? null,
          reference: generateBookingReference(),
          status: "PENDING",
          expiresAt,
          payments: {
            create: {
              reference: generatePaymentReference(),
              amount,
              currency: room.currency,
              status: "PENDING",
              method: "MOBILE_MONEY",
              provider: "manual",
              customerName: `${body.guestFirstName} ${body.guestLastName}`.trim(),
              customerEmail: body.guestEmail,
              customerPhone: body.guestPhone ?? null,
            },
          },
        },
        include: {
          room: {
            select: { id: true, slug: true, name: true, basePrice: true, currency: true },
          },
          payments: true,
        },
      });
    });

    // Notifications best-effort : ne doivent jamais faire échouer la réservation.
    await Promise.allSettled([
      notifyAdminNewBooking({
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
      }),
      notifyGuestBookingStatus({
        status: "PENDING",
        reference: booking.reference,
        roomName: booking.room?.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestFirstName: booking.guestFirstName,
        guestLastName: booking.guestLastName,
        guestEmail: booking.guestEmail,
      }),
    ]);

    return ok({ booking }, { status: 201 });
  } catch (e) {
    if (e instanceof BookingConflictError) {
      return fail(e.message, 409, "CONFLICT");
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Conflit de référence, veuillez réessayer", 409, "CONFLICT");
    }

    // Contention ou aléa de base : si la chambre a été prise entre-temps, c'est
    // un conflit légitime (409). Sinon, la réponse est retentable (503),
    // jamais un 500 opaque.
    if (isTransientDatabaseError(e)) {
      const nowConflicting = await hasBookingOverlap(body.roomId, checkInDate, checkOutDate).catch(
        () => false,
      );
      if (nowConflicting) {
        return fail("Cette chambre n'est pas disponible pour ces dates", 409, "CONFLICT");
      }
      console.error("[POST /api/bookings] transient database error", e);
      return fail("Service momentanément indisponible, veuillez réessayer", 503, "TEMPORARY_UNAVAILABLE");
    }

    console.error("[POST /api/bookings]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
});
