import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { z } from "zod";

export const runtime = "nodejs";

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

const handler = withAuth(async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");

  const parsed = await parseBody(req, reorderSchema);
  if (!parsed.ok) return parsed.response;

  await prisma.$transaction(
    parsed.data.ids.map((id, index) =>
      prisma.roomType.update({ where: { id }, data: { order: index } }),
    ),
  );

  return ok({ reordered: true });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST };
