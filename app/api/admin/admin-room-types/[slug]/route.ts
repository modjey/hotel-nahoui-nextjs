import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { roomTypeUpdateSchema, slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const slug = req.nextUrl.pathname.split("/").pop()!;
  if (req.method === "GET") {
    const type = await prisma.roomType.findUnique({ where: { slug } });
    if (!type) return fail("Type introuvable", 404, "NOT_FOUND");
    return ok({ type });
  }

  if (req.method === "PATCH") {
    const parsed = await parseBody(req, roomTypeUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const type = await prisma.roomType.findUnique({ where: { slug } });
    if (!type) return fail("Type introuvable", 404, "NOT_FOUND");

    if (body.slug && body.slug !== slug) {
      const existing = await prisma.roomType.findFirst({ where: { slug: body.slug, id: { not: type.id } } });
      if (existing) return fail("Slug déjà utilisé", 409, "SLUG_TAKEN");
    }

    const updated = await prisma.roomType.update({
      where: { slug },
      data: body.slug ? body : { ...body, slug: body.name ? slugify(body.name) : undefined },
    });
    return ok({ type: updated });
  }

  if (req.method === "DELETE") {
    const type = await prisma.roomType.findUnique({ where: { slug } });
    if (!type) return fail("Type introuvable", 404, "NOT_FOUND");
    const roomsCount = await prisma.room.count({ where: { roomTypeId: type.id } });
    if (roomsCount > 0) return fail(`Impossible de supprimer : ${roomsCount} chambre(s) rattachée(s)`, 400, "HAS_ROOMS");

    await prisma.roomType.delete({ where: { slug } });
    return ok({ deleted: true });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as PATCH, handler as DELETE };
