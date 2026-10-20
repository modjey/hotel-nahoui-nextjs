import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/catalog/schemas";

/** Code aléatoire à 6 chiffres utilisé comme suffixe de secours. */
function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Base de slug d'une chambre : "Nom de la chambre" + "CH09"
 * -> "nom-de-la-chambre-ch09". Sans numéro : "nom-de-la-chambre".
 */
export function roomSlugBase(name: string, roomNumber?: string | null): string {
  const base = slugify(name) || "chambre";
  const num = roomNumber ? slugify(roomNumber) : "";
  return num ? `${base}-${num}` : base;
}

/**
 * Retourne un slug unique pour une chambre. Si la base est déjà prise par une
 * autre chambre, un suffixe aléatoire à 6 chiffres est ajouté jusqu'à unicité
 * ("grande-mezzanine-ch09-483920").
 */
export async function ensureUniqueRoomSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "chambre";
  let candidate = root;
  while (
    await prisma.room.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${root}-${randomCode()}`;
  }
  return candidate;
}
