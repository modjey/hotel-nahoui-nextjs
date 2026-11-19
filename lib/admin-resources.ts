import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { blockingBookingWhere } from "@/lib/bookings";
import {
  type CrudConfig,
  endAfterStart,
  optionalDate,
  optionalInt,
  optionalText,
  requiredDate,
  stringList,
} from "@/lib/admin-crud";

/** Déclaration des contenus gérés par le module CRUD générique de l'admin. */

const offerSchema = z.object({
  title: z.string().trim().min(2, "Titre requis").max(160),
  category: z.enum(["SEJOUR", "RESTAURANT", "SEMINAIRE", "EVENEMENT", "BIEN_ETRE", "AUTRE"]).default("SEJOUR"),
  summary: optionalText(400),
  description: optionalText(8000),
  imageUrl: optionalText(500),
  price: optionalInt(0),
  priceLabel: optionalText(80),
  validFrom: optionalDate(),
  validUntil: optionalDate(),
  ctaLabel: optionalText(60),
  ctaUrl: optionalText(500),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isFlash: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

const eventSchema = z.object({
  title: z.string().trim().min(2, "Titre requis").max(160),
  summary: optionalText(400),
  description: optionalText(8000),
  imageUrl: optionalText(500),
  startDate: requiredDate(),
  endDate: optionalDate(),
  venue: optionalText(160),
  price: optionalInt(0),
  ctaLabel: optionalText(60),
  ctaUrl: optionalText(500),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

const facilitySchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  category: z.enum(["BIEN_ETRE", "RESTAURANT", "SEMINAIRE", "LOISIRS"]).default("BIEN_ETRE"),
  summary: optionalText(400),
  description: optionalText(8000),
  hours: optionalText(160),
  capacity: optionalText(160),
  features: stringList(),
  coverImageUrl: optionalText(500),
  gallery: stringList(),
  isPublished: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

const closureSchema = z.object({
  roomId: z.string().min(1, "Chambre requise"),
  startDate: requiredDate(),
  endDate: requiredDate(),
  reason: optionalText(200),
});

const seasonalRateSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  roomTypeId: z.preprocess((v) => (v === "" || v === "all" ? null : v), z.string().nullable().optional()),
  startDate: requiredDate(),
  endDate: requiredDate(),
  price: optionalInt(0),
  percent: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().int().min(-90).max(300).nullable().optional()),
  minStay: z.coerce.number().int().min(1).max(30).default(1),
  isActive: z.boolean().default(true),
});

const quoteSchema = z.object({
  type: z.enum(["GROUPE", "SEMINAIRE", "EVENEMENT"]).default("GROUPE"),
  status: z.enum(["NEW", "IN_PROGRESS", "SENT", "WON", "LOST"]).default("NEW"),
  companyName: optionalText(160),
  contactName: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40),
  startDate: optionalDate(),
  endDate: optionalDate(),
  guests: optionalInt(1),
  rooms: optionalInt(0),
  needs: optionalText(8000),
  quoteAmount: optionalInt(0),
  quoteNotes: optionalText(8000),
  adminNotes: optionalText(8000),
});

const rateCheck = (data: Record<string, unknown>) => {
  const dates = endAfterStart("startDate", "endDate")(data);
  if (dates) return dates;
  const hasPrice = data.price !== null && data.price !== undefined;
  const hasPercent = data.percent !== null && data.percent !== undefined;
  if (hasPrice === hasPercent) return "Indiquez soit un prix par nuit, soit un ajustement en %, pas les deux.";
  return null;
};

/** Une fermeture ne peut pas recouvrir une réservation active : il faut d'abord la déplacer ou l'annuler. */
const closureCheck = async (data: Record<string, unknown>) => {
  const dates = endAfterStart("startDate", "endDate", "La réouverture doit être après le début de la fermeture")(data);
  if (dates) return dates;
  const start = new Date(String(data.startDate));
  const end = new Date(String(data.endDate));
  const conflicts = await prisma.booking.findMany({
    where: { roomId: String(data.roomId), ...blockingBookingWhere(), checkIn: { lt: end }, checkOut: { gt: start } },
    select: { reference: true },
    take: 5,
  });
  if (conflicts.length > 0) {
    return `Impossible : réservation(s) active(s) sur cette période (${conflicts.map((c) => c.reference ?? "sans référence").join(", ")}). Déplacez-les ou annulez-les d'abord.`;
  }
  return null;
};

export function generateQuoteReference() {
  return `DV-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export const adminResources = {
  offers: {
    name: "offers",
    delegate: () => prisma.offer,
    schema: offerSchema,
    slugFrom: "title",
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    check: endAfterStart("validFrom", "validUntil", "La fin de validité doit être après le début"),
  },
  events: {
    name: "events",
    delegate: () => prisma.hotelEvent,
    schema: eventSchema,
    slugFrom: "title",
    orderBy: { startDate: "desc" },
    check: endAfterStart("startDate", "endDate"),
  },
  facilities: {
    name: "facilities",
    delegate: () => prisma.facility,
    schema: facilitySchema,
    slugFrom: "name",
    orderBy: [{ category: "asc" }, { order: "asc" }],
  },
  closures: {
    name: "closures",
    delegate: () => prisma.roomClosure,
    schema: closureSchema,
    orderBy: { startDate: "desc" },
    include: { room: { select: { id: true, name: true, roomNumber: true, slug: true } } },
    check: closureCheck,
  },
  "seasonal-rates": {
    name: "seasonal-rates",
    delegate: () => prisma.seasonalRate,
    schema: seasonalRateSchema,
    orderBy: { startDate: "desc" },
    include: { roomType: { select: { id: true, name: true } } },
    check: rateCheck,
  },
  quotes: {
    name: "quotes",
    delegate: () => prisma.quoteRequest,
    schema: quoteSchema,
    orderBy: { createdAt: "desc" },
    check: endAfterStart("startDate", "endDate"),
    beforeCreate: (data) => {
      data.reference = generateQuoteReference();
    },
  },
} satisfies Record<string, CrudConfig>;

export type AdminResourceName = keyof typeof adminResources;
