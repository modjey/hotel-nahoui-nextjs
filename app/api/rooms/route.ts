import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { roomCardSelect } from "@/lib/catalog/select";

export const runtime = "nodejs";

/** GET /api/rooms — liste publique des chambres publiées. */
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      select: roomCardSelect,
    });
    return ok({ rooms });
  } catch (e) {
    console.error("[GET /api/rooms]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
