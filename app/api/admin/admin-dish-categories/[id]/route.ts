import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").pop()!;

  if (req.method === "GET") {
    try {
      const category = await prisma.dishCategory.findUnique({
        where: { id },
      });

      if (!category) return fail("Catégorie introuvable", 404, "NOT_FOUND");

      return ok({ category });
    } catch (e) {
      console.error("[GET /api/admin/admin-dish-categories/[id]]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  if (req.method === "PATCH") {
    try {
      const body = await req.json();
      const { name, description, order, isPublished } = body;

      const updateData: any = {};
      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }
      if (description !== undefined) updateData.description = description;
      if (order !== undefined) updateData.order = order;
      if (isPublished !== undefined) updateData.isPublished = isPublished;

      const category = await prisma.dishCategory.update({
        where: { id },
        data: updateData,
      });

      return ok({ category });
    } catch (e) {
      console.error("[PATCH /api/admin/admin-dish-categories/[id]]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.dishCategory.delete({
        where: { id },
      });

      return ok({ message: "Catégorie supprimée" });
    } catch (e) {
      console.error("[DELETE /api/admin/admin-dish-categories/[id]]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
});

export { handler as GET, handler as PATCH, handler as DELETE };
