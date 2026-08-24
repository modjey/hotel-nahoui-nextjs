import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";

export const runtime = "nodejs";

/** GET /api/dishes — liste publique des plats publiés. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const categoryId = searchParams.get("categoryId");

    const where: any = { isPublished: true, isAvailable: true };
    if (locationId) where.locationId = locationId;
    if (categoryId) where.categoryId = categoryId;

    const dishes = await prisma.dish.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { name: "asc" }],
    });

    return ok({ dishes });
  } catch (e) {
    console.error("[GET /api/dishes]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
