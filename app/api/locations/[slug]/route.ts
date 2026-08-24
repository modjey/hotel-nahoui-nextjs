import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { locationDetailSelect } from "@/lib/catalog/select";

export const runtime = "nodejs";

/** GET /api/locations/[slug] — détail public d'une location avec ses chambres. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const location = await prisma.location.findFirst({
      where: { slug, isPublished: true },
      select: locationDetailSelect,
    });
    if (!location) return fail("Localisation introuvable", 404, "NOT_FOUND");
    return ok({ location });
  } catch (e) {
    console.error("[GET /api/locations/[slug]]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
