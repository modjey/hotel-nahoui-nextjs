import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").pop()!;

  if (req.method === "GET") {
    try {
      const dish = await prisma.dish.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      });

      if (!dish) return fail("Plat introuvable", 404, "NOT_FOUND");

      return ok({ dish });
    } catch (e) {
      console.error("[GET /api/admin/admin-dishes/[id]]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  if (req.method === "PATCH") {
    try {
      const body = await req.json();
      const { name, description, price, currency, categoryId, locationId, imageUrl, isAvailable, isPublished, isFeatured, order } = body;

      const updateData: any = {};
      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (currency !== undefined) updateData.currency = currency;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (locationId !== undefined) updateData.locationId = locationId;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (order !== undefined) updateData.order = order;

      const dish = await prisma.dish.update({
        where: { id },
        data: updateData,
      });

      return ok({ dish });
    } catch (e) {
      console.error("[PATCH /api/admin/admin-dishes/[id]]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.dish.delete({
        where: { id },
      });

      return ok({ message: "Plat supprimé" });
    } catch (e) {
      console.error("[DELETE /api/admin/admin-dishes/[id]]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
});

export { handler as GET, handler as PATCH, handler as DELETE };
