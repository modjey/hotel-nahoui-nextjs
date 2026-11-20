import { prisma } from "@/lib/prisma";
import { priceStayForRoom } from "@/lib/stay-pricing-server";
import { summarizePayments, type PaymentSummary } from "@/lib/payment-summary";

type BookingLike = {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  payments?: { status: string | null; amount?: number | null }[] | null;
};

/** Ajoute `paymentSummary` (total du séjour, encaissé, reste, état) à chaque réservation. */
export async function attachPaymentSummaries<T extends BookingLike>(
  bookings: T[],
): Promise<(T & { paymentSummary: PaymentSummary })[]> {
  const roomIds = [...new Set(bookings.map((b) => b.roomId))];
  const rooms = roomIds.length
    ? await prisma.room.findMany({
        where: { id: { in: roomIds } },
        select: { id: true, basePrice: true, discountPercent: true, roomTypeId: true, minStay: true },
      })
    : [];
  const byId = new Map(rooms.map((r) => [r.id, r]));
  return Promise.all(
    bookings.map(async (b) => {
      const room = byId.get(b.roomId);
      const total = room ? (await priceStayForRoom(room, b.checkIn, b.checkOut)).total : 0;
      return { ...b, paymentSummary: summarizePayments(total, b.payments) };
    }),
  );
}
