import { NextRequest } from "next/server";
import { handlePaymentCheckout } from "@/lib/payment-checkout";

export const runtime = "nodejs";

/**
 * Route historique : déléguée au checkout sûr et authentifié partagé.
 * Le provider utilisé est celui configuré dans PAYMENT_PROVIDER.
 */
export async function POST(request: NextRequest) {
  return handlePaymentCheckout(request);
}
