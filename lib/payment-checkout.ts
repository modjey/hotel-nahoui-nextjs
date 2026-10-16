import { NextRequest, NextResponse } from "next/server";
import { paymentProviderManager } from "@/lib/payment-provider";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth/session";
import { generatePaymentReference, nightsBetween } from "@/lib/bookings";
import { getDiscountedPrice } from "@/lib/pricing";

/**
 * Initie le paiement d'une réservation existante (metadata.booking_id).
 * Le montant fait foi côté serveur : le client ne peut pas le modifier.
 * Partagé par /api/payments/checkout et les routes provider historiques.
 */
export async function handlePaymentCheckout(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Body JSON invalide" }, { status: 400 });
    }

    const { returnUrl, cancelUrl, description, customer, metadata } = body as {
      returnUrl?: string;
      cancelUrl?: string;
      description?: string;
      customer?: { name?: string; email?: string; phone?: string };
      metadata?: { booking_id?: string; [k: string]: unknown };
    };

    const bookingId = metadata?.booking_id;
    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "booking_id requis : créez la réservation via POST /api/bookings" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: { orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
        room: { select: { name: true, basePrice: true, currency: true, discountPercent: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.userId && !isAdmin(session)) {
      return NextResponse.json({ success: false, message: "Accès refusé" }, { status: 403 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "Cette réservation a été annulée ou a expiré" },
        { status: 409 },
      );
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "Cette réservation est déjà terminée" },
        { status: 409 },
      );
    }

    // Acomptes : on encaisse la plus ancienne échéance PENDING. Si aucune
    // échéance n'existe, on en crée une pour le solde restant dû.
    const nextDue = booking.payments.find((p) => p.status === "PENDING");
    const paidTotal = booking.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0);
    const nightlyRate = getDiscountedPrice(booking.room.basePrice, booking.room.discountPercent);
    const stayTotal = nightlyRate * Math.max(1, nightsBetween(booking.checkIn, booking.checkOut));
    const remaining = Math.max(0, stayTotal - paidTotal);

    if (!nextDue && remaining <= 0) {
      return NextResponse.json(
        { success: false, message: "Cette réservation est déjà soldée" },
        { status: 409 },
      );
    }

    const payment = nextDue
      ? await prisma.payment.update({
          where: { id: nextDue.id },
          data: {
            provider: paymentProviderManager.getCurrentProvider(),
            customerName: customer?.name ?? nextDue.customerName,
            customerEmail: customer?.email ?? nextDue.customerEmail,
            customerPhone: customer?.phone ?? nextDue.customerPhone,
          },
        })
      : await prisma.payment.create({
          data: {
            bookingId: booking.id,
            reference: generatePaymentReference(),
            amount: remaining,
            currency: booking.room.currency || "XOF",
            status: "PENDING",
            method: "MOBILE_MONEY",
            provider: paymentProviderManager.getCurrentProvider(),
            customerName: customer?.name ?? null,
            customerEmail: customer?.email ?? null,
            customerPhone: customer?.phone ?? null,
          },
        });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    const result = await paymentProviderManager.createCheckout({
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.reference,
      description: description || `Paiement réservation ${booking.room?.name ?? ""}`.trim(),
      returnUrl: returnUrl || `${baseUrl}/bookings/confirmed?reference=${payment.reference}`,
      cancelUrl: cancelUrl || `${baseUrl}/bookings/cancelled?reference=${payment.reference}`,
      customer,
      metadata: { ...metadata, booking_id: booking.id },
    });

    if (!result.success) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[payment-checkout] error", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 },
    );
  }
}
