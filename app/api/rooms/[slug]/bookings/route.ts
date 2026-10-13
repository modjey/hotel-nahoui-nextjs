import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { blockingBookingWhere } from "@/lib/bookings";

export const runtime = "nodejs";

/**
 * GET /api/rooms/[slug]/bookings
 * Retourne les réservations futures actives d'une chambre (données non
 * nominatives : sert à construire le calendrier de disponibilité côté client).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const room = await prisma.room.findFirst({
      where: { slug, isPublished: true },
      select: { id: true },
    });

    if (!room) {
      return fail("Chambre introuvable", 404, "NOT_FOUND");
    }

    const bookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        ...blockingBookingWhere(),
        checkOut: { gte: new Date() },
      },
      orderBy: { checkIn: "asc" },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
    });

    return ok({ bookings });
  } catch (e) {
    console.error("[GET /api/rooms/[slug]/bookings]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
