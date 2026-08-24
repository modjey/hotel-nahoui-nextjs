import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";

export const runtime = "nodejs";

/** GET /api/dish-categories — liste publique des catégories publiées. */
export async function GET() {
  try {
    const categories = await prisma.dishCategory.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
    });

    return ok({ categories });
  } catch (e) {
    console.error("[GET /api/dish-categories]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
