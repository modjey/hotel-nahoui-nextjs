import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { z } from "zod";

export const runtime = "nodejs";

const reorderSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

const handler = withAuth(async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");

  const parsed = await parseBody(req, reorderSchema);
  if (!parsed.ok) return parsed.response;
  const { id, direction } = parsed.data;

  // L'ordre complet est recalculé à chaque déplacement : ça normalise aussi
  // les valeurs `order` dupliquées (toutes à 0 par défaut) dès le premier usage.
  const rooms = await prisma.room.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  const index = rooms.findIndex((r) => r.id === id);
  if (index === -1) return fail("Chambre introuvable", 404, "NOT_FOUND");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rooms.length) return ok({ reordered: false });

  const ids = rooms.map((r) => r.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];

  await prisma.$transaction(
    ids.map((roomId, i) =>
      prisma.room.update({ where: { id: roomId }, data: { order: i } }),
    ),
  );

  return ok({ reordered: true });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST };
