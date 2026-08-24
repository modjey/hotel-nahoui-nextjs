import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { roomTypeCreateSchema, slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "GET") {
    const types = await prisma.roomType.findMany({
      orderBy: [{ isPublished: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { rooms: true } } },
    });
    return ok({ types });
  }

  if (req.method === "POST") {
    const parsed = await parseBody(req, roomTypeCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const slug = body.slug || slugify(body.name);
    const existing = await prisma.roomType.findUnique({ where: { slug } });
    if (existing) return fail("Slug déjà utilisé", 409, "SLUG_TAKEN");

    const type = await prisma.roomType.create({ data: { ...body, slug } });
    return ok({ type }, { status: 201 });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST };
