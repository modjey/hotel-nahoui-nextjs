import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { mediaUpdateSchema } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").pop()!;
  if (req.method === "GET") {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return fail("Média introuvable", 404, "NOT_FOUND");
    return ok({ media });
  }

  if (req.method === "PATCH") {
    const parsed = await parseBody(req, mediaUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const media = await prisma.media.update({ where: { id }, data: body });
    return ok({ media });
  }

  if (req.method === "DELETE") {
    await prisma.media.delete({ where: { id } });
    return ok({ deleted: true });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as PATCH, handler as DELETE };
