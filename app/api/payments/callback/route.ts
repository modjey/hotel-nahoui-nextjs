import { NextRequest, NextResponse } from "next/server";
import { paymentProviderManager } from "@/lib/payment-provider";
import { createAdminNotification } from "@/lib/notifications";
import { normalizePaymentStatus, settlePaymentByReference } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Webhook de paiement. Idempotent : le fournisseur peut renvoyer plusieurs
 * fois le même événement.
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    const provider = paymentProviderManager.getCurrentProvider();

    let isValid = false;
    if (provider === "fineopay") {
      isValid = !!(callbackData.syncRef && callbackData.status && callbackData.reference);
    } else if (provider === "centralapis") {
      isValid = !!(callbackData.partner_reference && callbackData.state);
    }

    if (!isValid) {
      console.error("[payment callback] invalid payload", { provider, callbackData });
      return NextResponse.json({ success: false, message: "Invalid callback data" }, { status: 400 });
    }

    const callbackPayment = await paymentProviderManager.handleCallback(callbackData);
    const incomingStatus = normalizePaymentStatus(callbackPayment.status);

    const result = await settlePaymentByReference(
      callbackPayment.reference,
      incomingStatus,
      callbackPayment.transaction_id,
    );

    if (!result.ok) {
      console.error("[payment callback] unknown reference", callbackPayment.reference);
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }

    if (!result.changed) {
      return NextResponse.json({
        success: true,
        data: { reference: result.payment.reference, status: result.payment.status },
      });
    }

    if (result.latePayment) {
      await createAdminNotification({
        type: "PAYMENT_SUCCESS",
        title: "Paiement reçu après annulation",
        message: `Réf ${result.payment.reference} — à rembourser ou reconfirmer manuellement`,
        link: "/admin/bookings",
      });
    } else if (result.bookingStatus === "CONFIRMED" || result.bookingStatus === "CANCELLED") {
      await createAdminNotification({
        type: incomingStatus === "SUCCESS" ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
        title: incomingStatus === "SUCCESS" ? "Paiement reçu" : "Paiement échoué",
        message: `${result.payment.amount} ${result.payment.currency} (réf ${result.payment.reference})`,
        link: "/admin/bookings",
      });
    }

    return NextResponse.json({ success: true, data: result.payment });
  } catch (error) {
    console.error("[payment callback] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to process callback" },
      { status: 500 },
    );
  }
}
