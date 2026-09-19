import { prisma } from "@/lib/prisma";
import { notifyAdminNewBooking } from "@/lib/notifications";
import { ok, fail } from "@/lib/auth/api";
import { withAuth } from "@/lib/auth/api";
import { NextRequest } from "next/server";
import type { AuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * GET /api/bookings
 * Récupère les réservations de l'utilisateur connecté
 */
export const GET = withAuth(
  async (req: NextRequest, ctx: { session: AuthSession }) => {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          userId: ctx.session.userId,
        },
        include: {
          room: {
            select: {
              id: true,
              slug: true,
              name: true,
              coverImageUrl: true,
              basePrice: true,
              currency: true,
              location: {
                select: {
                  name: true,
                  city: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
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
 * Crée une nouvelle réservation en attente, sans paiement
 * Body: { roomId, checkIn, checkOut, adults, children, guestFirstName, guestLastName, guestEmail, guestPhone, reference? }
 */
export const POST = withAuth(
  async (req: NextRequest, ctx: { session: AuthSession }) => {
    try {
      const body = await req.json();
      console.log("[POST /api/bookings] Request body:", JSON.stringify(body, null, 2));
      const {
        roomId,
        checkIn,
        checkOut,
        adults,
        children,
        guestFirstName,
        guestLastName,
        guestEmail,
        guestPhone,
        reference,
      } = body;

      if (!roomId || !checkIn || !checkOut || adults === undefined || children === undefined) {
        console.error("[POST /api/bookings] Missing required fields:", { roomId, checkIn, checkOut, adults, children });
        return fail("roomId, checkIn, checkOut, adults et children sont requis", 400, "BAD_REQUEST");
      }

      if (!guestFirstName || !guestLastName || !guestEmail) {
        console.error("[POST /api/bookings] Missing guest info:", { guestFirstName, guestLastName, guestEmail });
        return fail("guestFirstName, guestLastName et guestEmail sont requis", 400, "BAD_REQUEST");
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkInDate >= checkOutDate) {
        return fail("checkIn doit être avant checkOut", 400, "BAD_REQUEST");
      }

      const totalGuests = adults + children;

      // Vérifier que la chambre existe
      const room = await prisma.room.findUnique({
        where: { id: roomId, isPublished: true },
      });

      if (!room) {
        return fail("Chambre introuvable", 404, "NOT_FOUND");
      }

      // Vérifier que le nombre total de voyageurs ne dépasse pas la capacité
      if (totalGuests > room.maxGuests) {
        return fail(`Cette chambre peut accueillir au maximum ${room.maxGuests} voyageurs`, 400, "BAD_REQUEST");
      }

      // Vérifier les réservations existantes qui chevauchent
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          roomId: room.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              checkIn: { lt: checkOutDate },
              checkOut: { gt: checkInDate },
            },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return fail("Cette chambre n'est pas disponible pour ces dates", 409, "CONFLICT");
      }

      // Créer la réservation
      const booking = await prisma.booking.create({
        data: {
          roomId: room.id,
          userId: ctx.session.userId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults,
          children,
          guestFirstName,
          guestLastName,
          guestEmail,
          guestPhone,
          reference: reference || `BK-${Date.now()}`,
          status: "PENDING",
        },
        include: {
          room: {
            select: {
              id: true,
              slug: true,
              name: true,
              basePrice: true,
              currency: true,
            },
          },
          payment: true,
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
    } catch (e) {
      console.error("[POST /api/bookings]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  },
);
