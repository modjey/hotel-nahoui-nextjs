import { z } from "zod";

/** Slugify : "Suite Présidentielle" -> "suite-presidentielle". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* -------------------------------- Location ------------------------------- */

const slugSchema = z
  .string()
  .min(2, "Slug doit contenir au moins 2 caractères")
  .max(80, "Slug trop long (max 80)")
  .regex(/^[a-zA-Z0-9-_]+$/, "Slug invalide (lettres, chiffres, tirets, underscores)");

export const locationCreateSchema = z.object({
  slug: slugSchema.optional(),
  name: z.string().min(2).max(120),
  shortDescription: z.string().max(280).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  mapLink: z.string().max(2000).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  coverImageUrl: z.string().max(2000).optional().nullable(),
  amenities: z.array(z.string().min(1).max(200)).max(40).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const locationUpdateSchema = locationCreateSchema.partial();

/* -------------------------------- RoomType -------------------------------- */

export const roomTypeCreateSchema = z.object({
  slug: slugSchema.optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional().nullable(),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export const roomTypeUpdateSchema = roomTypeCreateSchema.partial();

/* ---------------------------------- Room --------------------------------- */

export const roomCreateSchema = z.object({
  slug: slugSchema.optional(),
  name: z.string().min(2).max(120),
  roomNumber: z.string().max(50).optional().nullable(),
  shortDescription: z.string().max(280).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  locationId: z.string().min(1),
  roomTypeId: z.string().min(1),
  basePrice: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  maxGuests: z.number().int().min(1).max(20).optional(),
  beds: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  sizeSqm: z.number().int().min(1).max(10000).optional().nullable(),
  amenities: z.array(z.string().min(1).max(200)).max(40).optional(),
  coverImageUrl: z.string().max(2000).optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().int().optional(),
  checkInStart: z.string().optional().nullable(),
  checkInEnd: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  checkInMethod: z.string().max(200).optional().nullable(),
  cancellationPolicy: z.string().max(500).optional().nullable(),
});

export const roomUpdateSchema = roomCreateSchema.partial();

/* ---------------------------------- Media --------------------------------- */

export const mediaCreateSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]),
  provider: z.enum(["LOCAL", "YOUTUBE", "EXTERNAL"]).optional(),
  url: z.string().min(1).max(2000),
  thumbnailUrl: z.string().max(2000).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
  order: z.number().int().optional(),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
  durationSec: z.number().int().optional().nullable(),
  sizeBytes: z.number().int().optional().nullable(),
  // au moins un parent
  locationId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
}).refine((v) => !!v.locationId || !!v.roomId, {
  message: "Le média doit être rattaché à une location ou une chambre",
  path: ["locationId"],
});

export const mediaUpdateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
  order: z.number().int().optional(),
  thumbnailUrl: z.string().max(2000).optional().nullable(),
});

/* --------------------------------- helpers -------------------------------- */

/** Extrait l'ID d'une URL YouTube (youtu.be/xxx, watch?v=xxx, shorts/xxx). */
export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(shorts|embed)\/([\w-]+)/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}
