import { prisma } from "@/lib/prisma";
import { priceStay, type PricedRoom, type RateRule } from "@/lib/stay-pricing";

/** Tarifs saisonniers actifs qui touchent la période [from, to). */
export async function loadRateRules(from: Date, to: Date): Promise<RateRule[]> {
  return prisma.seasonalRate.findMany({
    where: { isActive: true, startDate: { lt: to }, endDate: { gt: from } },
    select: { id: true, name: true, roomTypeId: true, startDate: true, endDate: true, price: true, percent: true, minStay: true, createdAt: true },
  });
}

/** Prix d'un séjour pour une chambre, tarifs saisonniers inclus. */
export async function priceStayForRoom(room: PricedRoom, checkIn: Date, checkOut: Date) {
  const rules = await loadRateRules(checkIn, checkOut);
  return priceStay(room, checkIn, checkOut, rules);
}

/** Fermetures de chambre qui chevauchent [checkIn, checkOut). */
export async function findClosure(roomId: string, checkIn: Date, checkOut: Date) {
  return prisma.roomClosure.findFirst({
    where: { roomId, startDate: { lt: checkOut }, endDate: { gt: checkIn } },
    select: { id: true, startDate: true, endDate: true },
  });
}
