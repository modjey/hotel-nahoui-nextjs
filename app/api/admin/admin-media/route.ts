import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { mediaCreateSchema, parseYoutubeId } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "POST") {
    const parsed = await parseBody(req, mediaCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Détection automatique du provider pour les vidéos YouTube
    let provider = body.provider ?? "LOCAL";
    let url = body.url;
    if (body.type === "VIDEO" && !provider) {
      const ytId = parseYoutubeId(url);
      if (ytId) {
        provider = "YOUTUBE";
        url = ytId; // on stocke juste l'ID
      } else {
        provider = "EXTERNAL";
      }
    }

    // Vérifier que le parent existe
    if (body.locationId) {
      const loc = await prisma.location.findUnique({ where: { id: body.locationId } });
      if (!loc) return fail("Localisation introuvable", 400, "INVALID_LOCATION");
    }
    if (body.roomId) {
      const room = await prisma.room.findUnique({ where: { id: body.roomId } });
      if (!room) return fail("Chambre introuvable", 400, "INVALID_ROOM");
    }

    const media = await prisma.media.create({
      data: { ...body, provider, url },
    });
    return ok({ media }, { status: 201 });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST };
