import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Cron job endpoint to archive completed bookings
 * Changes CONFIRMED bookings to COMPLETED when checkOut date is in the past
 * Should be called daily by external cron service
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

    // Find CONFIRMED bookings where checkOut is in the past
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkOut: {
          lt: now,
        },
      },
    });

    console.log(`=== CRON: Found ${completedBookings.length} completed bookings to archive`);

    // Archive completed bookings
    const results = await Promise.all(
      completedBookings.map(async (booking: any) => {
        try {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'COMPLETED' },
          });

          console.log(`=== CRON: Archived booking ${booking.reference}`);
          return { id: booking.id, reference: booking.reference, success: true };
        } catch (error) {
          console.error(`=== CRON: Failed to archive booking ${booking.reference}`, error);
          return { id: booking.id, reference: booking.reference, success: false, error: String(error) };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Archived ${successCount} completed bookings`,
      stats: {
        total: completedBookings.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    console.error('=== CRON: Archive error', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Archive failed' },
      { status: 500 }
    );
  }
}
