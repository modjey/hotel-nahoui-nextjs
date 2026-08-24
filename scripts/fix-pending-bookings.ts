import { prisma } from "../lib/prisma";

async function fixPendingBookings() {
  try {
    // Find all PENDING bookings without expiresAt
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: null,
      },
    });

    console.log(`Found ${pendingBookings.length} PENDING bookings without expiresAt`);

    // Update them to expire in 15 minutes from now
    const results = await Promise.all(
      pendingBookings.map(async (booking) => {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
        });
        console.log(`Updated booking ${booking.reference} with expiresAt`);
        return booking.id;
      })
    );

    console.log(`Updated ${results.length} bookings`);
  } catch (error) {
    console.error("Error fixing pending bookings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPendingBookings();
