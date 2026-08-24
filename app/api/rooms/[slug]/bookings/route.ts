import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";

export const runtime = "nodejs";

/**
 * GET /api/rooms/[slug]/bookings
 * Retourne les réservations futures d'une chambre
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const room = await prisma.room.findUnique({
      where: { slug, isPublished: true },
    });

    if (!room) {
      return fail("Chambre introuvable", 404, "NOT_FOUND");
    }

    const bookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        checkOut: { gte: new Date() },
      },
      orderBy: { checkIn: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return ok({ bookings });
  } catch (e) {
    console.error("[GET /api/rooms/[slug]/bookings]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
