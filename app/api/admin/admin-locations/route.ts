import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { locationCreateSchema, slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "GET") {
    // Liste admin : inclut non-publiées
    const locations = await prisma.location.findMany({
      orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { rooms: true } } },
    });
    return ok({ locations });
  }

  if (req.method === "POST") {
    const parsed = await parseBody(req, locationCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const slug = slugify(body.slug || body.name);
    const existing = await prisma.location.findUnique({ where: { slug } });
    if (existing) return fail("Slug déjà utilisé", 409, "SLUG_TAKEN");

    const location = await prisma.location.create({
      data: { ...body, slug },
    });
    return ok({ location }, { status: 201 });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST };
