import { NextRequest, NextResponse } from "next/server";
import { paymentProviderManager } from "@/lib/payment-provider";
import { prisma } from "@/lib/prisma";
import { normalizePaymentStatus, settlePaymentByReference } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payments/status?reference=...
 * Interroge le fournisseur puis aligne la base de données sur le statut réel.
 * Sert de filet de sécurité si le webhook n'est jamais arrivé.
 */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ success: false, message: "Reference is required" }, { status: 400 });
  }

  try {
    let providerStatus: Awaited<ReturnType<typeof paymentProviderManager.getTransactionStatus>> = null;
    try {
      providerStatus = await paymentProviderManager.getTransactionStatus(reference);
    } catch (e) {
      console.warn("[payments/status] provider lookup failed", e);
    }

    if (providerStatus?.status) {
      const result = await settlePaymentByReference(
        providerStatus.reference || reference,
        normalizePaymentStatus(providerStatus.status),
        providerStatus.transaction_id,
      );
      if (result.ok) {
        return NextResponse.json({
          success: true,
          data: {
            reference: result.payment.reference,
            amount: result.payment.amount,
            currency: result.payment.currency,
            status: result.payment.status,
            bookingStatus: result.bookingStatus,
          },
        });
      }
    }

    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { booking: { select: { status: true } } },
    });

    if (!payment) {
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        bookingStatus: payment.booking?.status,
      },
    });
  } catch (error) {
    console.error("[payments/status] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to get payment status" },
      { status: 500 },
    );
  }
}
