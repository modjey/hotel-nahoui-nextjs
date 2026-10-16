import { prisma } from "@/lib/prisma";

export type SettledPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

/** Normalise les statuts hétérogènes des fournisseurs vers PaymentStatus. */
export function normalizePaymentStatus(value: unknown): SettledPaymentStatus {
  const s = String(value ?? "").toUpperCase();
  if (["SUCCESS", "DONE", "PAID", "COMPLETED"].includes(s)) return "SUCCESS";
  if (["FAILED", "FAILURE", "CANCELLED", "CANCELED", "ERROR"].includes(s)) return "FAILED";
  if (["REFUNDED", "REFUND"].includes(s)) return "REFUNDED";
  return "PENDING";
}

export type SettleResult =
  | { ok: false; reason: "NOT_FOUND" }
  | {
      ok: true;
      payment: { id: string; reference: string; amount: number; currency: string; status: SettledPaymentStatus };
      changed: boolean;
      ignored?: boolean;
      idempotent?: boolean;
      bookingStatus?: string;
      latePayment?: boolean;
    };

/**
 * Applique un statut de paiement de façon idempotente et cohérente :
 * - un paiement déjà SUCCESS n'est jamais rétrogradé ;
 * - la réservation est confirmée uniquement si elle n'est pas annulée ;
 * - un paiement réussi sur une réservation annulée est signalé (latePayment).
 */
export async function settlePaymentByReference(
  reference: string,
  incomingStatus: SettledPaymentStatus,
  transactionId?: string | null,
): Promise<SettleResult> {
  const existing = await prisma.payment.findUnique({
    where: { reference },
    include: { booking: { select: { id: true, status: true, guestFirstName: true, guestLastName: true } } },
  });

  if (!existing) return { ok: false, reason: "NOT_FOUND" };

  if (existing.status === "SUCCESS" && incomingStatus !== "SUCCESS") {
    return { ok: true, payment: existing, changed: false, ignored: true };
  }
  if (existing.status === incomingStatus) {
    return { ok: true, payment: existing, changed: false, idempotent: true };
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: existing.id },
      data: {
        status: incomingStatus,
        transactionId: transactionId ?? existing.transactionId,
        paidAt: incomingStatus === "SUCCESS" ? existing.paidAt ?? new Date() : existing.paidAt,
      },
    });

    let bookingStatus: string | undefined;
    let latePayment = false;

    if (existing.booking) {
      if (incomingStatus === "SUCCESS") {
        if (existing.booking.status === "CANCELLED") {
          latePayment = true;
        } else if (existing.booking.status !== "COMPLETED") {
          bookingStatus = "CONFIRMED";
          await tx.booking.update({
            where: { id: existing.booking.id },
            data: { status: "CONFIRMED", expiresAt: null },
          });
        }
      } else if (incomingStatus === "FAILED" && existing.booking.status === "PENDING") {
        // Avec un échéancier, un versement échoué n'annule la réservation que
        // s'il ne reste ni échéance en attente ni acompte déjà encaissé.
        const remaining = await tx.payment.count({
          where: {
            bookingId: existing.booking.id,
            status: { in: ["PENDING", "SUCCESS"] },
            id: { not: payment.id },
          },
        });
        if (remaining === 0) {
          bookingStatus = "CANCELLED";
          await tx.booking.update({
            where: { id: existing.booking.id },
            data: { status: "CANCELLED", expiresAt: null },
          });
        }
      }
    }

    return { ok: true as const, payment, changed: true, bookingStatus, latePayment };
  });
}
