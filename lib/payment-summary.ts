/** Situation de règlement d'une réservation (le paiement se fait hors ligne, en une ou plusieurs fois). */
export type PaymentState = "UNPAID" | "PARTIAL" | "PAID";

export type PaymentSummary = {
  /** Montant du séjour (tarifs saisonniers inclus). */
  total: number;
  /** Somme des paiements encaissés. */
  paid: number;
  remaining: number;
  state: PaymentState;
};

export function summarizePayments(
  total: number,
  payments: { status: string | null; amount?: number | null }[] | undefined | null,
): PaymentSummary {
  const paid = (payments ?? [])
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const remaining = Math.max(0, total - paid);
  const state: PaymentState = paid <= 0 ? "UNPAID" : remaining > 0 ? "PARTIAL" : "PAID";
  return { total, paid, remaining, state };
}

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiel",
  PAID: "Soldé",
};

/** Classes du badge selon l'état (vert = soldé, orange = partiel, gris = rien encaissé). */
export const PAYMENT_STATE_CLASS: Record<PaymentState, string> = {
  UNPAID: "border-border text-muted-foreground",
  PARTIAL: "border-amber-600 text-amber-700 bg-amber-50",
  PAID: "border-green-600 text-green-700 bg-green-50",
};
