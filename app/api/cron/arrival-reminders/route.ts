import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingEmail } from "@/lib/booking-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAD_HOURS = 48;
const BATCH_SIZE = 100;

/**
 * Cron : rappel par email aux clients dont l'arrivée (réservation confirmée) a lieu
 * dans les 48 h. Idempotent grâce à `arrivalReminderSentAt` : un client ne reçoit qu'un rappel.
 *
 * Vercel Cron : path "/api/cron/arrival-reminders", une fois par jour.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if ((cronSecret || process.env.NODE_ENV === "production") && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const due = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        arrivalReminderSentAt: null,
        checkIn: { gte: now, lte: new Date(now.getTime() + LEAD_HOURS * 3600_000) },
      },
      select: { id: true },
      take: BATCH_SIZE,
    });

    let sent = 0;
    for (const { id } of due) {
      if (await sendBookingEmail(id, { type: "ARRIVAL_REMINDER" })) {
        await prisma.booking.update({ where: { id }, data: { arrivalReminderSentAt: new Date() } });
        sent++;
      }
    }

    return NextResponse.json({ success: true, stats: { due: due.length, sent } });
  } catch (error) {
    console.error("=== CRON: arrival reminders error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Arrival reminders failed" },
      { status: 500 },
    );
  }
}
