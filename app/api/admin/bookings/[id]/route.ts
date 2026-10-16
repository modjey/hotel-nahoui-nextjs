import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { PENDING_BOOKING_TTL_MS, overlapBookingWhere, validateBookingDates } from "@/lib/bookings";
import { z } from "zod";

const bookingUpdateSchema = z.object({
  roomId: z.string().optional(),
  userId: z.string().nullable().optional(),
  guestFirstName: z.string().nullable().optional(),
  guestLastName: z.string().nullable().optional(),
  guestEmail: z.string().email().nullable().optional(),
  guestPhone: z.string().nullable().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  status: z.enum(["CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"]).optional(),
});

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").pop()!;

  if (req.method === "GET") {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
            slug: true,
            name: true,
            basePrice: true,
            currency: true,
            discountPercent: true,
          },
        },
        payments: {
          orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!booking) return fail("Réservation introuvable", 404, "NOT_FOUND");

    return ok({ booking });
  }

  if (req.method === "PATCH") {
    const parsed = await parseBody(req, bookingUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return fail("Réservation introuvable", 404, "NOT_FOUND");

    // Vérifier la chambre si elle est modifiée
    if (body.roomId) {
      const room = await prisma.room.findUnique({ where: { id: body.roomId } });
      if (!room) return fail("Chambre introuvable", 400, "INVALID_ROOM");
    }

    // Vérifier les dates si elles sont modifiées
    if (body.checkIn || body.checkOut) {
      const checkIn = body.checkIn ? new Date(body.checkIn) : new Date(existing.checkIn);
      const checkOut = body.checkOut ? new Date(body.checkOut) : new Date(existing.checkOut);
      const dateError = validateBookingDates(checkIn, checkOut, { allowPast: true });
      if (dateError) return fail(dateError.message, 400, dateError.code);

      // Vérifier les chevauchements de réservations (excluant la réservation actuelle)
      const roomId = body.roomId || existing.roomId;
      const overlapping = await prisma.booking.findFirst({
        where: overlapBookingWhere(roomId, checkIn, checkOut, { excludeBookingId: id }),
        select: { id: true },
      });

      if (overlapping) {
        return fail("Cette chambre est déjà réservée pour ces dates", 400, "DATES_UNAVAILABLE");
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(body.roomId && { roomId: body.roomId }),
        ...(body.userId !== undefined && { userId: body.userId }),
        ...(body.guestFirstName !== undefined && { guestFirstName: body.guestFirstName }),
        ...(body.guestLastName !== undefined && { guestLastName: body.guestLastName }),
        ...(body.guestEmail !== undefined && { guestEmail: body.guestEmail }),
        ...(body.guestPhone !== undefined && { guestPhone: body.guestPhone }),
        ...(body.checkIn && { checkIn: new Date(body.checkIn) }),
        ...(body.checkOut && { checkOut: new Date(body.checkOut) }),
        ...(body.adults && { adults: body.adults }),
        ...(body.children !== undefined && { children: body.children }),
        ...(body.status && {
          status: body.status,
          // Une réservation PENDING redevient temporaire ; les autres statuts
          // libèrent la chambre immédiatement.
          expiresAt:
            body.status === "PENDING"
              ? new Date(Date.now() + PENDING_BOOKING_TTL_MS)
              : null,
        }),
      },
      include: {
        room: {
          select: {
            id: true,
            slug: true,
            name: true,
            basePrice: true,
            currency: true,
            discountPercent: true,
          },
        },
        payments: {
          orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return ok({ booking: updated });
  }

  if (req.method === "DELETE") {
    await prisma.booking.delete({ where: { id } });
    return ok({ deleted: true });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as PATCH, handler as DELETE };
