import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/site-settings";
import { priceStayForRoom } from "@/lib/stay-pricing-server";
import { groupNights } from "@/lib/stay-pricing";
import { nightsBetween } from "@/lib/bookings";

/** Données d'une facture proforma pour une réservation (affichage imprimable + email). */
export async function buildBookingProforma(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      room: {
        select: { name: true, roomNumber: true, basePrice: true, discountPercent: true, currency: true, roomTypeId: true, minStay: true, cancellationPolicy: true, roomType: { select: { name: true } } },
      },
      payments: { select: { amount: true, status: true } },
    },
  });
  if (!booking) return null;

  const [settings, bookingSettings, stay] = await Promise.all([
    getSetting("proforma"),
    getSetting("booking"),
    priceStayForRoom(booking.room, booking.checkIn, booking.checkOut),
  ]);

  const paid = booking.payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);
  const issuedAt = new Date();
  const validUntil = new Date(issuedAt.getTime() + settings.validityDays * 86_400_000);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  return {
    number: `PF-${booking.reference ?? booking.id.slice(-8).toUpperCase()}`,
    issuedAt,
    validUntil,
    hotel: settings,
    conditions: bookingSettings.conditions,
    cancellationPolicy: booking.room.cancellationPolicy,
    guest: {
      name: [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || booking.user?.name || "Client",
      email: booking.guestEmail || booking.user?.email || null,
      phone: booking.guestPhone || booking.user?.phone || null,
    },
    booking: {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights,
      adults: booking.adults,
      children: booking.children,
    },
    room: {
      name: booking.room.roomNumber ? `${booking.room.name} (N° ${booking.room.roomNumber})` : booking.room.name,
      type: booking.room.roomType?.name ?? null,
    },
    currency: booking.room.currency,
    lines: groupNights(stay.nights).map((g) => ({
      label: `${booking.room.name}${g.rateName ? ` — ${g.rateName}` : ""}`,
      from: g.from,
      quantity: g.count,
      unitPrice: g.price,
      amount: g.count * g.price,
    })),
    total: stay.total,
    paid,
    remaining: Math.max(0, stay.total - paid),
  };
}

export type BookingProforma = NonNullable<Awaited<ReturnType<typeof buildBookingProforma>>>;
