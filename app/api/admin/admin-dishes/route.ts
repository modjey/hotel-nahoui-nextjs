import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

/** GET /api/admin/admin-dishes — liste des plats (admin). */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const categoryId = searchParams.get("categoryId");

    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (categoryId) where.categoryId = categoryId;

    const dishes = await prisma.dish.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return ok({ dishes });
  } catch (e) {
    console.error("[GET /api/admin/admin-dishes]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

/** POST /api/admin/admin-dishes — créer un plat. */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, description, price, currency, categoryId, locationId, imageUrl, isAvailable, isPublished, isFeatured, order } = body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return fail("Le nom du plat est requis", 400, "BAD_REQUEST");
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return fail("Le prix doit être un nombre positif", 400, "BAD_REQUEST");
    }
    if (!categoryId || !locationId) {
      return fail("Catégorie et localisation sont requises", 400, "BAD_REQUEST");
    }

    const slug = slugify(name);

    const dish = await prisma.dish.create({
      data: {
        slug,
        name,
        description,
        price: Number(price),
        currency,
        categoryId,
        locationId,
        imageUrl,
        isAvailable: isAvailable ?? true,
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        order: order ?? 0,
      },
    });

    return ok({ dish }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/admin-dishes]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
