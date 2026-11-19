import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { loadRateRules } from "@/lib/stay-pricing-server";
import { dayKey, minStayFor, nightlyPrice, startOfUtcDay } from "@/lib/stay-pricing";
import { PENDING_BOOKING_TTL_HOURS } from "@/lib/booking-config";

export const runtime = "nodejs";

const DAY_MS = 86_400_000;
const HORIZON_DAYS = 400;

/**
 * GET /api/rooms/[slug]/calendar
 * Prix et séjour minimum par date (tarifs saisonniers + promo), et dates fermées
 * (fermetures de chambre) sur ~13 mois. Les réservations restent servies par
 * /api/rooms/[slug]/bookings. Format compatible avec HotelBookingCalendar.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const room = await prisma.room.findFirst({
      where: { isPublished: true, OR: [{ slug }, { id: slug }] },
      select: { id: true, basePrice: true, discountPercent: true, roomTypeId: true, minStay: true, currency: true },
    });
    if (!room) return fail("Chambre introuvable", 404, "NOT_FOUND");

    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const to = new Date(from.getTime() + HORIZON_DAYS * DAY_MS);
    const [rules, closures] = await Promise.all([
      loadRateRules(from, to),
      prisma.roomClosure.findMany({
        where: { roomId: room.id, endDate: { gt: from }, startDate: { lt: to } },
        select: { startDate: true, endDate: true },
      }),
    ]);

    const days: Record<string, { available: boolean; price?: number; minStay?: number }> = {};
    for (let t = from.getTime(); t < to.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const { price } = nightlyPrice(d, room, rules);
      const minStay = minStayFor(d, room, rules);
      const closed = closures.some((c) => startOfUtcDay(c.startDate).getTime() <= t && startOfUtcDay(c.endDate).getTime() > t);
      days[dayKey(d)] = { available: !closed, price, ...(minStay > 1 ? { minStay } : {}) };
    }

    return ok({ days, currency: room.currency, defaultMinStay: Math.max(1, room.minStay), holdHours: PENDING_BOOKING_TTL_HOURS });
  } catch (e) {
    console.error("[GET /api/rooms/[slug]/calendar]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
