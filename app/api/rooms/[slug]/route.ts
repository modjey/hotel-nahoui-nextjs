import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { roomDetailSelect } from "@/lib/catalog/select";

export const runtime = "nodejs";

/** GET /api/rooms/[slug] — détail public d'une chambre avec sa galerie. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const room = await prisma.room.findFirst({
      where: { slug, isPublished: true },
      select: roomDetailSelect,
    });
    if (!room) return fail("Chambre introuvable", 404, "NOT_FOUND");
    return ok({ room });
  } catch (e) {
    console.error("[GET /api/rooms/[slug]]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
