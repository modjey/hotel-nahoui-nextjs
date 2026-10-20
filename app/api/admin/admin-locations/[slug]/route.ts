import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { locationUpdateSchema, slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const slug = req.nextUrl.pathname.split("/").pop()!;
  if (req.method === "GET") {
    const location = await prisma.location.findUnique({
      where: { slug },
      include: { media: { orderBy: { order: "asc" } } },
    });
    if (!location) return fail("Localisation introuvable", 404, "NOT_FOUND");
    return ok({ location });
  }

  if (req.method === "PATCH") {
    const parsed = await parseBody(req, locationUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const location = await prisma.location.findUnique({ where: { slug } });
    if (!location) return fail("Localisation introuvable", 404, "NOT_FOUND");

    // Le slug ne change que s'il est fourni explicitement ou si le nom a
    // réellement changé — sinon il est conservé tel quel. L'unicité est
    // vérifiée dans les deux cas pour éviter une erreur P2002 non gérée.
    const nextSlug = body.slug ?? (body.name && body.name !== location.name ? slugify(body.name) : undefined);
    if (nextSlug && nextSlug !== slug) {
      const existing = await prisma.location.findFirst({ where: { slug: nextSlug, id: { not: location.id } } });
      if (existing) return fail("Slug déjà utilisé", 409, "SLUG_TAKEN");
    }

    const updated = await prisma.location.update({
      where: { slug },
      data: nextSlug ? { ...body, slug: nextSlug } : body,
    });
    return ok({ location: updated });
  }

  if (req.method === "DELETE") {
    // Empêcher si des chambres sont rattachées
    const location = await prisma.location.findUnique({ where: { slug } });
    if (!location) return fail("Localisation introuvable", 404, "NOT_FOUND");
    const roomsCount = await prisma.room.count({ where: { locationId: location.id } });
    if (roomsCount > 0) return fail(`Impossible de supprimer : ${roomsCount} chambre(s) rattachée(s)`, 400, "HAS_ROOMS");

    await prisma.location.delete({ where: { slug } });
    return ok({ deleted: true });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as PATCH, handler as DELETE };
