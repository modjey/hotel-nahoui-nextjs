import { prisma } from "@/lib/prisma";
import type { FacilityCategory, OfferCategory } from "@prisma/client";

/**
 * Contenus publiés lisibles par le site public (offres, événements, espaces).
 * Les dates sont converties en chaînes ISO pour passer aux composants client.
 * En cas d'erreur base de données, on renvoie une liste vide : la page garde son contenu par défaut.
 */

export type PublicOffer = {
  id: string;
  slug: string;
  title: string;
  category: OfferCategory;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  priceLabel: string | null;
  validFrom: string | null;
  validUntil: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isFeatured: boolean;
};

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  venue: string | null;
  price: number | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isFeatured: boolean;
};

export type PublicFacility = {
  id: string;
  slug: string;
  name: string;
  category: FacilityCategory;
  summary: string | null;
  description: string | null;
  hours: string | null;
  capacity: string | null;
  features: string[];
  coverImageUrl: string | null;
  gallery: string[];
};

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const today = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

export async function getPublishedOffers(opts: { category?: OfferCategory; featuredOnly?: boolean; flashOnly?: boolean; limit?: number } = {}): Promise<PublicOffer[]> {
  try {
    const rows = await prisma.offer.findMany({
      where: {
        isPublished: true,
        ...(opts.category ? { category: opts.category } : {}),
        ...(opts.featuredOnly ? { isFeatured: true } : {}),
        // Pop-up flash : uniquement pendant la période de validité (début inclus).
        ...(opts.flashOnly ? { isFlash: true, AND: [{ OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }] }] } : {}),
        OR: [{ validUntil: null }, { validUntil: { gte: today() } }],
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: opts.limit,
    });
    return rows.map((o) => ({
      id: o.id,
      slug: o.slug,
      title: o.title,
      category: o.category,
      summary: o.summary,
      description: o.description,
      imageUrl: o.imageUrl,
      price: o.price,
      priceLabel: o.priceLabel,
      validFrom: iso(o.validFrom),
      validUntil: iso(o.validUntil),
      ctaLabel: o.ctaLabel,
      ctaUrl: o.ctaUrl,
      isFeatured: o.isFeatured,
    }));
  } catch (e) {
    console.error("[public-content] offres indisponibles", e);
    return [];
  }
}

export async function getUpcomingEvents(opts: { featuredOnly?: boolean; limit?: number } = {}): Promise<PublicEvent[]> {
  try {
    const rows = await prisma.hotelEvent.findMany({
      where: {
        isPublished: true,
        ...(opts.featuredOnly ? { isFeatured: true } : {}),
        OR: [{ endDate: { gte: today() } }, { endDate: null, startDate: { gte: today() } }],
      },
      orderBy: { startDate: "asc" },
      take: opts.limit,
    });
    return rows.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      description: e.description,
      imageUrl: e.imageUrl,
      startDate: e.startDate.toISOString(),
      endDate: iso(e.endDate),
      venue: e.venue,
      price: e.price,
      ctaLabel: e.ctaLabel,
      ctaUrl: e.ctaUrl,
      isFeatured: e.isFeatured,
    }));
  } catch (e) {
    console.error("[public-content] événements indisponibles", e);
    return [];
  }
}

export async function getFacilities(category: FacilityCategory): Promise<PublicFacility[]> {
  try {
    const rows = await prisma.facility.findMany({
      where: { isPublished: true, category },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    return rows.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      category: f.category,
      summary: f.summary,
      description: f.description,
      hours: f.hours,
      capacity: f.capacity,
      features: f.features,
      coverImageUrl: f.coverImageUrl,
      gallery: f.gallery,
    }));
  } catch (e) {
    console.error("[public-content] espaces indisponibles", e);
    return [];
  }
}
