import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { startOfMonth, subMonths, addDays, startOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method !== "GET") return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const in30Days = addDays(now, 30);
  const thirtyDaysAgo = addDays(now, -30);
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const [
    locations,
    locationsPublished,
    rooms,
    roomsPublished,
    roomTypes,
    users,
    usersLast30d,
    media,
    bookingsTotal,
    bookingsPending,
    bookingsConfirmed,
    bookingsCancelled,
    bookingsCompleted,
    checkInsToday,
    checkOutsToday,
    upcomingBookings,
    paymentsTotal,
    paymentsSuccess,
    paymentsPending,
    revenueByCurrency,
    payments6m,
    bookings6m,
    overlappingNext30d,
    reviewsTotal,
    reviewsPending,
    reviewsAvg,
    contactsTotal,
    contactsNew,
    topRoomsRaw,
    recentBookings,
  ] = await Promise.all([
    prisma.location.count(),
    prisma.location.count({ where: { isPublished: true } }),
    prisma.room.count(),
    prisma.room.count({ where: { isPublished: true } }),
    prisma.roomType.count(),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.media.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({
      where: { checkIn: { gte: todayStart, lt: tomorrowStart }, status: "CONFIRMED" },
    }),
    prisma.booking.count({
      where: { checkOut: { gte: todayStart, lt: tomorrowStart }, status: "CONFIRMED" },
    }),
    prisma.booking.count({
      where: { checkIn: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    // Revenus par devise
    prisma.payment.groupBy({
      by: ["currency"],
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    // Paiements des 6 derniers mois (série mensuelle)
    prisma.payment.findMany({
      where: { status: "SUCCESS", createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, currency: true, createdAt: true },
    }),
    // Réservations créées sur 6 mois (série mensuelle)
    prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    // Nuits réservées sur les 30 prochains jours (taux d'occupation)
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { lt: in30Days },
        checkOut: { gt: now },
      },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.review.count(),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.contactSubmission.count(),
    prisma.contactSubmission.count({ where: { status: "new" } }),
    // Top chambres par nombre de réservations
    prisma.booking.groupBy({
      by: ["roomId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    // Dernières réservations
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { room: { select: { name: true, slug: true } } },
    }),
  ]);

  // Série mensuelle : revenus (XOF) + nb de réservations sur 6 mois
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const month = startOfMonth(subMonths(now, 5 - i));
    return { key: format(month, "yyyy-MM"), label: format(month, "MMM", { locale: fr }), revenue: 0, bookings: 0 };
  });
  const bucketIndex = new Map(monthBuckets.map((b, i) => [b.key, i]));

  for (const p of payments6m) {
    if (p.currency !== "XOF") continue;
    const idx = bucketIndex.get(format(startOfMonth(p.createdAt), "yyyy-MM"));
    if (idx !== undefined) monthBuckets[idx].revenue += p.amount;
  }
  for (const b of bookings6m) {
    const idx = bucketIndex.get(format(startOfMonth(b.createdAt), "yyyy-MM"));
    if (idx !== undefined) monthBuckets[idx].bookings += 1;
  }

  // Taux d'occupation sur 30 jours = nuits réservées / (chambres publiées × 30)
  let bookedNights = 0;
  for (const b of overlappingNext30d) {
    const start = b.checkIn > now ? b.checkIn : now;
    const end = b.checkOut < in30Days ? b.checkOut : in30Days;
    bookedNights += Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  }
  const occupancyRate =
    roomsPublished > 0 ? Math.min(100, Math.round((bookedNights / (roomsPublished * 30)) * 100)) : 0;

  // Noms des chambres du top
  const topRoomIds = topRoomsRaw.map((r) => r.roomId);
  const topRoomNames = topRoomIds.length
    ? await prisma.room.findMany({
        where: { id: { in: topRoomIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const topRooms = topRoomsRaw.map((r) => {
    const room = topRoomNames.find((t) => t.id === r.roomId);
    return {
      roomId: r.roomId,
      name: room?.name || "Chambre supprimée",
      slug: room?.slug || "",
      bookings: r._count.id,
    };
  });

  const revenueTotal = revenueByCurrency.reduce((sum, r) => sum + (r._sum.amount ?? 0), 0);
  const revenueMonth = monthBuckets[monthBuckets.length - 1].revenue;

  return ok({
    stats: {
      locations: { total: locations, published: locationsPublished },
      rooms: { total: rooms, published: roomsPublished },
      roomTypes,
      users: { total: users, last30d: usersLast30d },
      media,
      bookings: {
        total: bookingsTotal,
        pending: bookingsPending,
        confirmed: bookingsConfirmed,
        cancelled: bookingsCancelled,
        completed: bookingsCompleted,
        upcoming: upcomingBookings,
        checkInsToday,
        checkOutsToday,
      },
      payments: {
        total: paymentsTotal,
        success: paymentsSuccess,
        pending: paymentsPending,
        revenueTotal,
        revenueMonth,
        currency: "XOF",
        byCurrency: revenueByCurrency.map((r) => ({
          currency: r.currency,
          total: r._sum.amount ?? 0,
        })),
      },
      occupancyRate,
      reviews: {
        total: reviewsTotal,
        pending: reviewsPending,
        avgRating: Math.round((reviewsAvg._avg.rating ?? 0) * 10) / 10,
      },
      contacts: { total: contactsTotal, new: contactsNew },
      monthly: monthBuckets,
      topRooms,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        guestName:
          [b.guestFirstName, b.guestLastName].filter(Boolean).join(" ") || "—",
        roomName: b.room?.name || "—",
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        createdAt: b.createdAt,
      })),
    },
  });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET };
