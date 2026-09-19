import { prisma } from "@/lib/prisma";
import { notifyAdminNewBooking } from "@/lib/notifications";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
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

    // Vérifier les dates
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    if (checkIn >= checkOut) {
      return fail("La date de départ doit être après la date d'arrivée", 400, "INVALID_DATES");
    }

    // Vérifier les chevauchements de réservations
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: body.roomId,
        status: { in: ["CONFIRMED", "PENDING"] },
        OR: [
          {
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        ],
      },
    });

    if (overlapping) {
      return fail("Cette chambre est déjà réservée pour ces dates", 400, "DATES_UNAVAILABLE");
    }

    // Générer une référence
    const reference = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const booking = await prisma.booking.create({
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
        reference,
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
