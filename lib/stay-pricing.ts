import { getDiscountedPrice } from "@/lib/pricing";

/**
 * Calcul du prix d'un séjour nuit par nuit, avec tarifs saisonniers et séjour minimum.
 * Fonctions pures (aucun accès base) : utilisables côté serveur, côté client et en test.
 * Les dates sont manipulées en UTC (l'hôtel est à Abidjan, UTC+0, sans heure d'été).
 */

export type RateRule = {
  id?: string;
  name?: string;
  roomTypeId: string | null;
  startDate: Date | string;
  endDate: Date | string;
  price: number | null;
  percent: number | null;
  minStay: number;
  createdAt?: Date | string;
};

export type PricedRoom = {
  basePrice: number;
  discountPercent?: number | null;
  roomTypeId?: string | null;
  minStay?: number | null;
};

export type NightPrice = { date: string; price: number; rateName?: string };

const DAY_MS = 86_400_000;

/** "AAAA-MM-JJ" en UTC. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Minuit UTC du jour calendaire le plus proche. Le navigateur envoie « minuit heure locale » :
 * pour un visiteur à Paris (UTC+1), le 21 décembre arrive en 2026-12-20T23:00Z. Arrondir à
 * ±12 h retrouve le bon jour pour tous les fuseaux de UTC-12 à UTC+12.
 */
export function startOfUtcDay(date: Date | string): Date {
  const d = new Date(new Date(date).getTime() + 12 * 3_600_000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Règle applicable à une nuit : la plus récente parmi celles qui couvrent la date. */
export function ruleForNight(night: Date, room: PricedRoom, rules: RateRule[]): RateRule | null {
  const t = startOfUtcDay(night).getTime();
  let best: RateRule | null = null;
  for (const r of rules) {
    if (r.roomTypeId && r.roomTypeId !== room.roomTypeId) continue;
    if (startOfUtcDay(r.startDate).getTime() > t || startOfUtcDay(r.endDate).getTime() <= t) continue;
    if (!best) best = r;
    else {
      // Une règle propre au type de chambre l'emporte sur une règle générale, puis la plus récente.
      const specificity = Number(Boolean(r.roomTypeId)) - Number(Boolean(best.roomTypeId));
      const newer = new Date(r.createdAt ?? 0).getTime() > new Date(best.createdAt ?? 0).getTime();
      if (specificity > 0 || (specificity === 0 && newer)) best = r;
    }
  }
  return best;
}

/**
 * Prix d'une nuit : tarif saisonnier puis promotion de la chambre.
 * Un prix fixe saisonnier est un prix final : la promo ne s'y applique pas.
 */
export function nightlyPrice(night: Date, room: PricedRoom, rules: RateRule[]): { price: number; rule: RateRule | null } {
  const rule = ruleForNight(night, room, rules);
  if (rule?.price != null) return { price: rule.price, rule };
  const base = rule?.percent != null ? Math.max(0, Math.round(room.basePrice * (1 + rule.percent / 100))) : room.basePrice;
  return { price: getDiscountedPrice(base, room.discountPercent), rule };
}

/** Séjour minimum pour une arrivée à cette date (max entre la chambre et la saison). */
export function minStayFor(checkIn: Date, room: PricedRoom, rules: RateRule[]): number {
  const rule = ruleForNight(checkIn, room, rules);
  return Math.max(1, room.minStay ?? 1, rule?.minStay ?? 1);
}

/** Détail et total d'un séjour [checkIn, checkOut). */
export function priceStay(room: PricedRoom, checkIn: Date, checkOut: Date, rules: RateRule[]) {
  const start = startOfUtcDay(checkIn);
  const end = startOfUtcDay(checkOut);
  const nights: NightPrice[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
    const d = new Date(t);
    const { price, rule } = nightlyPrice(d, room, rules);
    nights.push({ date: dayKey(d), price, rateName: rule?.name });
  }
  const total = nights.reduce((s, n) => s + n.price, 0);
  return { nights, total, minStay: minStayFor(start, room, rules) };
}

/** Regroupe les nuits consécutives au même prix (pour une facture lisible). */
export function groupNights(nights: NightPrice[]) {
  const groups: { from: string; count: number; price: number; rateName?: string }[] = [];
  for (const n of nights) {
    const last = groups[groups.length - 1];
    if (last && last.price === n.price && last.rateName === n.rateName) last.count += 1;
    else groups.push({ from: n.date, count: 1, price: n.price, rateName: n.rateName });
  }
  return groups;
}
