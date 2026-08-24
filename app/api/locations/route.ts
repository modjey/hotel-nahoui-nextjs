import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { locationCardSelect } from "@/lib/catalog/select";

export const runtime = "nodejs";

/** GET /api/locations — liste publique des localisations publiées. */
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      select: locationCardSelect,
    });
    return ok({ locations });
  } catch (e) {
    console.error("[GET /api/locations]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
