import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Cron job endpoint to clean up expired PENDING bookings
 * Should be called every 5 minutes by external cron service
 *
 * Usage with Vercel Cron Jobs:
 * Add to vercel.json with path: "/api/cron/cleanup-expired-bookings" and schedule: "0/5 * * * *"
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find expired PENDING bookings
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      include: {
        payment: true,
      },
    });

    console.log(`=== CRON: Found ${expiredBookings.length} expired PENDING bookings`);

    // Update expired bookings to CANCELLED
    const results = await Promise.all(
      expiredBookings.map(async (booking: any) => {
        try {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CANCELLED' },
          });

          // Also update associated payment if exists
          if (booking.payment) {
            await prisma.payment.update({
              where: { id: booking.payment.id },
              data: { status: 'FAILED' },
            });
          }

          console.log(`=== CRON: Cancelled expired booking ${booking.reference}`);
          return { id: booking.id, reference: booking.reference, success: true };
        } catch (error) {
          console.error(`=== CRON: Failed to cancel booking ${booking.reference}`, error);
          return { id: booking.id, reference: booking.reference, success: false, error: String(error) };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${successCount} expired bookings`,
      stats: {
        total: expiredBookings.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    console.error('=== CRON: Cleanup error', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}
