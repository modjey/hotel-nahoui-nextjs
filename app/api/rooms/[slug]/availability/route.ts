import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/rooms/[slug]/availability?checkIn=2024-01-01&checkOut=2024-01-03&userId=xxx
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
  const userId = searchParams.get("userId");

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

    // Chercher les réservations qui chevauchent les dates demandées
    // CONFIRMED: toujours bloquant
    // PENDING: toujours bloquant (indépendamment de expiresAt)
    // COMPLETED/CANCELLED: ne bloquent pas
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        OR: [
          {
            status: "CONFIRMED",
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
          {
            status: "PENDING",
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        ],
      },
    });

    console.log(`[Availability] Room: ${room.id}, Dates: ${checkIn} - ${checkOut}, Overlapping bookings: ${overlappingBookings.length}`, overlappingBookings.map((b: any) => ({ id: b.id, status: b.status, expiresAt: b.expiresAt, checkIn: b.checkIn, checkOut: b.checkOut, userId: b.userId })));

    // Vérifier si le conflit appartient à l'utilisateur connecté
    const isOwnBooking = userId && overlappingBookings.some((b: any) => b.userId === userId);

    const isAvailable = overlappingBookings.length === 0;

    return ok({
      available: isAvailable,
      roomId: room.id,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      overlappingBookings: overlappingBookings.length,
      isOwnBooking,
      conflictingBookings: overlappingBookings.map((b: any) => ({
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        userId: b.userId,
      })),
    });
  } catch (e) {
    console.error("[GET /api/rooms/[slug]/availability]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
