/**
 * Configuration SEO centralisée — réutilisée par app/layout.tsx, sitemap.ts,
 * robots.ts, manifest.ts et le JSON-LD (Organization/Hotel).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://www.nahouihotel.ci"
).replace(/\/$/, "");

export const SITE_NAME = "Hôtel Nahoui Balmer";

export const SITE_DESCRIPTION =
  "L'Hôtel Nahoui Balmer, à San Pedro depuis 2016 : 28 chambres et suites, piscine, spa, salle de sport, restaurant de cuisine ivoirienne, bars, salles de réception et espace jeux pour enfants. Réservation en ligne en FCFA.";

export const SITE_KEYWORDS = [
  "hôtel San Pedro",
  "hôtel Côte d'Ivoire",
  "Hôtel Nahoui Balmer",
  "réservation hôtel San Pedro",
  "chambre hôtel San Pedro",
  "restaurant San Pedro",
  "spa San Pedro",
  "séjour Côte d'Ivoire",
];

/** Image par défaut utilisée pour les partages Open Graph / Twitter Card. */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/assets/hero.png`,
  width: 1774,
  height: 887,
  alt: SITE_NAME,
};

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: "Hôtel Nahoui Balmer",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  telephone: "+225 27 34 71 22 33",
  email: "reservations@nahouihotel.ci",
  priceRange: "₣₣",
  address: {
    streetAddress: "01 BP 1864 San-Pedro 01",
    addressLocality: "San-Pédro",
    addressCountry: "CI",
  },
  geo: {
    latitude: 4.7493,
    longitude: -6.6285,
  },
  sameAs: [
    "https://www.instagram.com/hotel_nahoui/",
    "https://www.facebook.com/hotelnahouibalmer",
    "https://www.tiktok.com/@nahouihotel",
  ],
};

/** Construit une URL absolue à partir d'un chemin relatif du site. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
