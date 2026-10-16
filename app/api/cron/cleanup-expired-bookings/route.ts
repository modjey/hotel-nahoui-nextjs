import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 200;

/**
 * Cron : annule les réservations PENDING expirées (créneaux non payés).
 * Idempotent — peut être appelé toutes les 5 minutes.
 *
 * Vercel Cron : path "/api/cron/cleanup-expired-bookings", schedule toutes les 5 minutes.
 */
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    let cancelled = 0;
    let paymentsFailed = 0;

    // Boucle par lots pour éviter de charger un volume illimité en mémoire.
    for (;;) {
      const expired = await prisma.booking.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
          // Ne jamais annuler une réservation ayant déjà un versement encaissé.
          NOT: { payments: { some: { status: "SUCCESS" } } },
        },
        select: { id: true, reference: true },
        take: BATCH_SIZE,
      });

      if (expired.length === 0) break;

      const ids = expired.map((b) => b.id);

      const [, paymentResult] = await Promise.all([
        prisma.booking.updateMany({
          where: { id: { in: ids }, status: "PENDING" },
          data: { status: "CANCELLED", expiresAt: null },
        }),
        prisma.payment.updateMany({
          where: { bookingId: { in: ids }, status: "PENDING" },
          data: { status: "FAILED" },
        }),
      ]);

      cancelled += expired.length;
      paymentsFailed += paymentResult.count;

      if (expired.length < BATCH_SIZE) break;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cancelled} expired bookings`,
      stats: { cancelled, paymentsFailed },
    });
  } catch (error) {
    console.error("=== CRON: Cleanup error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 },
    );
  }
}
