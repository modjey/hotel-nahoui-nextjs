import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { fail, ok, parseBody, reqMeta, serializeUser } from "@/lib/auth/api";
import { passwordLoginSchema } from "@/lib/auth/schemas";
import { prisma } from "@/lib/prisma";
import { issueTokens, setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Email + password login. Used by admin panel (and any user who set a password).
 */
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, passwordLoginSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.isActive) {
    return fail("Identifiants invalides", 401, "INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return fail("Identifiants invalides", 401, "INVALID_CREDENTIALS");

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
