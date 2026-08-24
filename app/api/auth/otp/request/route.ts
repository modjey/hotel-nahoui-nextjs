import type { NextRequest } from "next/server";
import { fail, ok, parseBody } from "@/lib/auth/api";
import { otpRequestSchema, identifierSchema } from "@/lib/auth/schemas";
import { createAndSendOtp } from "@/lib/auth/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, otpRequestSchema);
  if (!parsed.ok) return parsed.response;

  const ident = identifierSchema.safeParse(parsed.data.identifier);
  if (!ident.success) return fail("Email ou numéro CI invalide", 422, "INVALID_IDENTIFIER");

  const { channel, identifier } = ident.data;
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
