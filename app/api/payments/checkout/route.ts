import { NextRequest } from "next/server";
import { handlePaymentCheckout } from "@/lib/payment-checkout";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handlePaymentCheckout(request);
}
