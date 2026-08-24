import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/auth/api";
import { rotateRefreshToken, setAuthCookies } from "@/lib/auth/session";
import { REFRESH_COOKIE } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {

  let bodyToken: string | undefined;
  try {
    const json = (await req.json().catch(() => null)) as { refreshToken?: string } | null;
    bodyToken = json?.refreshToken;
  } catch {

  }
  const cookieToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const token = bodyToken ?? cookieToken;
  if (!token) return fail("Refresh token manquant", 401, "NO_REFRESH_TOKEN");

  const tokens = await rotateRefreshToken(token);
  if (!tokens) {
    const res = fail("Session invalide", 401, "INVALID_REFRESH_TOKEN");
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const res = ok({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    refreshExpiresAt: tokens.refreshExpiresAt,
  });

  await setAuthCookies(tokens);
  return res;
}
