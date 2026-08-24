import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method !== "GET") return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");

  const [locations, locationsPublished, rooms, roomsPublished, roomTypes, users, media, bookingsTotal, bookingsPending, bookingsConfirmed, paymentsTotal, paymentsSuccess, paymentsPending] = await Promise.all([
    prisma.location.count(),
    prisma.location.count({ where: { isPublished: true } }),
    prisma.room.count(),
    prisma.room.count({ where: { isPublished: true } }),
    prisma.roomType.count(),
    prisma.user.count(),
    prisma.media.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ]);

  return ok({
    stats: {
      locations: { total: locations, published: locationsPublished },
      rooms: { total: rooms, published: roomsPublished },
      roomTypes,
      users,
      media,
      bookings: { total: bookingsTotal, pending: bookingsPending, confirmed: bookingsConfirmed },
      payments: { total: paymentsTotal, success: paymentsSuccess, pending: paymentsPending },
    },
  });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET };
