import type { NextRequest } from "next/server";
import { fail, ok, parseBody, reqMeta, serializeUser } from "@/lib/auth/api";
import { otpVerifySchema, identifierSchema } from "@/lib/auth/schemas";
import { verifyOtp } from "@/lib/auth/otp";
import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";
import { issueTokens, setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, otpVerifySchema);
  if (!parsed.ok) return parsed.response;

  const ident = identifierSchema.safeParse(parsed.data.identifier);
  if (!ident.success) return fail("Identifiant invalide", 422, "INVALID_IDENTIFIER");

  const { channel, identifier } = ident.data;

  const result = await verifyOtp({
    identifier,
    channel: channel === "EMAIL" ? "EMAIL" : "SMS",
    code: parsed.data.code,
  });
  if (!result.success) return fail(result.error ?? "Code invalide", 400, "OTP_INVALID");

  // Find or create user
  const where = channel === "EMAIL" ? { email: identifier } : { phone: identifier };
  let user = await prisma.user.findUnique({ where });

  if (!user) {
    user = await prisma.user.create({
      data: {
        ...(channel === "EMAIL"
          ? { email: identifier, emailVerified: new Date() }
          : { phone: identifier, phoneVerified: new Date() }),
        name: parsed.data.name ?? null,
        role: "USER",
      },
    });
    await createAdminNotification({
      type: "USER_REGISTERED",
      title: "Nouvel utilisateur",
      message: `${user.name || identifier} s'est inscrit via ${channel === "EMAIL" ? "email" : "SMS"}`,
      link: "/admin/users",
    });
  } else {
    // Mark identifier verified if not yet
    const patch: Record<string, unknown> = {};
    if (channel === "EMAIL" && !user.emailVerified) patch.emailVerified = new Date();
    if (channel === "SMS" && !user.phoneVerified) patch.phoneVerified = new Date();
    if (Object.keys(patch).length) {
      user = await prisma.user.update({ where: { id: user.id }, data: patch });
    }
  }

  if (!user.isActive) return fail("Compte désactivé", 403, "ACCOUNT_DISABLED");

  const tokens = await issueTokens(user, reqMeta(req));
  await setAuthCookies(tokens);

  return ok({
    user: serializeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    refreshExpiresAt: tokens.refreshExpiresAt,
  });
}
