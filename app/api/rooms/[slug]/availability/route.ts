import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { blockingBookingWhere } from "@/lib/bookings";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findClosure, priceStayForRoom } from "@/lib/stay-pricing-server";
import { nightsBetween } from "@/lib/bookings";

export const runtime = "nodejs";

/**
 * GET /api/rooms/[slug]/availability?checkIn=2024-01-01&checkOut=2024-01-03
 * « isOwnBooking » est calculé à partir de la session, jamais d'un paramètre client.
 * Vérifie si une chambre est disponible pour les dates données
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!checkIn || !checkOut) {
    return fail("checkIn et checkOut sont requis", 400, "BAD_REQUEST");
  }

  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return fail("checkIn doit être avant checkOut", 400, "BAD_REQUEST");
    }

    // Vérifier que la chambre existe
    const room = await prisma.room.findUnique({
      where: { slug, isPublished: true },
    });

    if (!room) {
      return fail("Chambre introuvable", 404, "NOT_FOUND");
    }

    // Chercher les réservations qui chevauchent les dates demandées.
    // CONFIRMED = bloquant ; PENDING = bloquant tant que non expiré ;
    // COMPLETED/CANCELLED ainsi que les PENDING expirés ne bloquent pas.
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        ...blockingBookingWhere(),
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { id: true, status: true, checkIn: true, checkOut: true, userId: true },
    });

    // Vérifier si le conflit appartient à l'utilisateur connecté
    const session = await getSession(req);
    const userId = session?.userId ?? null;
    const isOwnBooking = Boolean(userId) && overlappingBookings.some((b) => b.userId === userId);

    const [closure, stay] = await Promise.all([
      findClosure(room.id, checkInDate, checkOutDate),
      priceStayForRoom(room, checkInDate, checkOutDate),
    ]);
    const nights = nightsBetween(checkInDate, checkOutDate);
    const meetsMinStay = nights >= stay.minStay;
    const isAvailable = overlappingBookings.length === 0 && !closure && meetsMinStay;

    return ok({
      available: isAvailable,
      closed: Boolean(closure),
      minStay: stay.minStay,
      meetsMinStay,
      total: stay.total,
      nights: stay.nights,
      currency: room.currency,
      roomId: room.id,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      overlappingBookings: overlappingBookings.length,
      isOwnBooking,
      conflictingBookings: overlappingBookings.map((b) => ({
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
      })),
    });
  } catch (e) {
    console.error("[GET /api/rooms/[slug]/availability]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
