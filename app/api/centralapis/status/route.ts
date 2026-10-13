import { NextRequest, NextResponse } from "next/server";
import { centralApisService } from "@/lib/centralapis";
import { prisma } from "@/lib/prisma";
import { normalizePaymentStatus, settlePaymentByReference } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Polling de statut CentralApis (route historique) : aligne la base sur le
 * statut réel, de façon idempotente.
 */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ success: false, message: "Reference is required" }, { status: 400 });
  }

  try {
    let providerStatus: Awaited<ReturnType<typeof centralApisService.getTransactionStatus>> = null;
    try {
      providerStatus = await centralApisService.getTransactionStatus(reference);
    } catch (e) {
      console.warn("[centralapis/status] provider lookup failed", e);
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
    console.error("[centralapis/status] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to get payment status" },
      { status: 500 },
    );
  }
}
