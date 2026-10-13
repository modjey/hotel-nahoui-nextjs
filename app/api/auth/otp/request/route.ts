import type { NextRequest } from "next/server";
import { fail, ok, parseBody } from "@/lib/auth/api";
import { otpRequestSchema, identifierSchema } from "@/lib/auth/schemas";
import { createAndSendOtp } from "@/lib/auth/otp";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, otpRequestSchema);
  if (!parsed.ok) return parsed.response;

  const ident = identifierSchema.safeParse(parsed.data.identifier);
  if (!ident.success) return fail("Email ou numéro CI invalide", 422, "INVALID_IDENTIFIER");

  const { channel, identifier } = ident.data;

  // Anti-abus : 5 demandes par identifiant et 20 par IP toutes les 15 minutes.
  const perIdent = rateLimit(`otp:id:${identifier}`, 5, 15 * 60 * 1000);
  const perIp = rateLimit(`otp:ip:${clientKey(req.headers)}`, 20, 15 * 60 * 1000);
  if (!perIdent.ok || !perIp.ok) {
    return fail(
      "Trop de demandes de code. Réessayez dans quelques minutes.",
      429,
      "TOO_MANY_REQUESTS",
    );
  }

  const result = await createAndSendOtp({
    identifier,
    channel: channel === "EMAIL" ? "EMAIL" : "SMS",
  });
  if (!result.success) return fail(result.error ?? "Envoi échoué", 400, "OTP_SEND_FAILED");

  return ok({
    channel,
    identifier,
    ttlMinutes: 10,
    ...(result.debugCode ? { debugCode: result.debugCode } : {}),
  });
}
