import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HOTEL_CONTACT } from "@/lib/hotel-contact";

/**
 * Réglages éditables depuis Admin → Paramètres, stockés en JSON dans SiteSetting.
 * Chaque clé a un schéma et des valeurs par défaut : une clé absente ou invalide
 * en base n'empêche jamais le site de s'afficher.
 */

const url = z.string().trim().max(500);

export const settingSchemas = {
  home: z.object({
    heroVideoUrl: url.default("/assets/banner.mp4"),
    heroImageUrl: url.default("/assets/hero.png"),
    heroEyebrow: z.string().trim().max(120).default("San Pedro, Côte d'Ivoire - depuis 2016"),
    heroTitle: z.string().trim().max(80).default("Hôtel Nahoui Balmer"),
    heroSubtitle: z
      .string()
      .trim()
      .max(400)
      .default(
        "Entre jardin tropical et océan Atlantique : 28 chambres et suites, piscine, spa, salle de sport, table ivoirienne, deux bars, salles de réception et espace jeux pour enfants.",
      ),
  }),
  booking: z.object({
    conditions: z
      .string()
      .trim()
      .max(8000)
      .default(
        [
          "Une réservation effectuée sur le site est une demande : elle est confirmée par l'hôtel après accord sur le règlement.",
          "Le règlement se fait hors ligne (espèces, Mobile Money, virement) selon les modalités communiquées par l'hôtel.",
          "Arrivée à partir de 15h, départ avant 12h.",
          "Annulation : selon la politique indiquée sur la fiche de chaque chambre.",
          "Toute demande non confirmée dans le délai indiqué est annulée automatiquement.",
        ].join("\n"),
      ),
  }),
  proforma: z.object({
    companyName: z.string().trim().max(160).default("Hôtel Nahoui Balmer"),
    address: z.string().trim().max(300).default("01 BP 1864 San-Pédro 01, Côte d'Ivoire"),
    phone: z.string().trim().max(120).default(HOTEL_CONTACT.phones.join(" / ")),
    email: z.string().trim().max(160).default(HOTEL_CONTACT.reservationsEmail),
    legalIds: z.string().trim().max(300).default(""), // RCCM, compte contribuable...
    paymentDetails: z.string().trim().max(1000).default(""), // coordonnées bancaires / Mobile Money
    validityDays: z.coerce.number().int().min(1).max(90).default(7),
    footerNote: z.string().trim().max(1000).default("Proforma valable sous réserve de disponibilité au moment de la confirmation."),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;

export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return key in settingSchemas;
}

/** Valeur d'un réglage, complétée par les valeurs par défaut. Ne lève jamais d'exception. */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const schema = settingSchemas[key];
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    const parsed = schema.safeParse(row?.value ?? {});
    if (parsed.success) return parsed.data as SettingValue<K>;
    console.warn(`[site-settings] valeur invalide pour "${key}", valeurs par défaut utilisées`);
  } catch (e) {
    console.error(`[site-settings] lecture de "${key}" impossible`, e);
  }
  return schema.parse({}) as SettingValue<K>;
}

/** Enregistre un réglage après validation ; renvoie la valeur normalisée. */
export async function saveSetting<K extends SettingKey>(key: K, input: unknown): Promise<SettingValue<K>> {
  const value = settingSchemas[key].parse(input) as SettingValue<K>;
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  return value;
}
