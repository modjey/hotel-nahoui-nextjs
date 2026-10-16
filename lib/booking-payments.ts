/** Résumé des versements (échéances) d'une réservation. */
export type BookingPaymentLike = { amount: number; currency: string; status: string };

export type PaymentSummary = {
  /** Somme des versements encaissés (SUCCESS). */
  paid: number;
  /** Somme des échéances encore attendues (PENDING). */
  pending: number;
  /** Nombre de versements. */
  count: number;
  /** Au moins un versement encaissé (acompte ou totalité). */
  hasPaid: boolean;
  /** Devise dominante (premier versement). */
  currency: string | null;
};

export function summarizePayments(payments: BookingPaymentLike[] | null | undefined): PaymentSummary {
  const list = payments ?? [];
  return {
    paid: list.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
    pending: list.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0),
    count: list.length,
    hasPaid: list.some((p) => p.status === "SUCCESS"),
    currency: list[0]?.currency ?? null,
  };
}
