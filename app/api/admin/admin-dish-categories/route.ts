import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

/** GET /api/admin/admin-dish-categories — liste des catégories (admin). */
export const GET = withAuth(async () => {
  try {
    const categories = await prisma.dishCategory.findMany({
      orderBy: { order: "asc" },
    });
    return ok({ categories });
  } catch (e) {
    console.error("[GET /api/admin/admin-dish-categories]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

/** POST /api/admin/admin-dish-categories — créer une catégorie. */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, description, order, isPublished } = body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return fail("Le nom de la catégorie est requis", 400, "BAD_REQUEST");
    }

    const slug = slugify(name);

    const category = await prisma.dishCategory.create({
      data: {
        slug,
        name,
        description,
        order: order ?? 0,
        isPublished: isPublished ?? false,
      },
    });

    return ok({ category }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/admin-dish-categories]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
