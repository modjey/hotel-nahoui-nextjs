import { NextRequest, NextResponse } from "next/server";
import { createAdminNotification } from "@/lib/notifications";
import { normalizePaymentStatus, settlePaymentByReference } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Webhook FineoPay (route historique). Délégué au règlement idempotent partagé.
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    if (!callbackData.syncRef || !callbackData.status || !callbackData.reference) {
      return NextResponse.json({ success: false, message: "Invalid callback data" }, { status: 400 });
    }

    const incomingStatus = normalizePaymentStatus(callbackData.status);
    const result = await settlePaymentByReference(
      callbackData.reference,
      incomingStatus,
      callbackData.syncRef,
    );

    if (!result.ok) {
      console.error("[fineopay callback] unknown reference", callbackData.reference);
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }

    if (result.changed && result.bookingStatus && incomingStatus === "SUCCESS") {
      await createAdminNotification({
        type: "PAYMENT_SUCCESS",
        title: "Paiement reçu",
        message: `${result.payment.amount} ${result.payment.currency} (réf ${result.payment.reference})`,
        link: "/admin/bookings",
      });
    }
    if (result.latePayment) {
      await createAdminNotification({
        type: "PAYMENT_SUCCESS",
        title: "Paiement reçu après annulation",
        message: `Réf ${result.payment.reference} — à rembourser ou reconfirmer manuellement`,
        link: "/admin/bookings",
      });
    }

    return NextResponse.json({
      success: true,
      data: { reference: result.payment.reference, status: result.payment.status },
    });
  } catch (error) {
    console.error("[fineopay callback] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to process callback" },
      { status: 500 },
    );
  }
}
