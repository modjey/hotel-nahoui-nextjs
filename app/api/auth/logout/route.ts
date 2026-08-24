import type { NextRequest } from "next/server";
import { ok } from "@/lib/auth/api";
import { clearAuthCookies, revokeSessionByRefreshToken } from "@/lib/auth/session";
import { REFRESH_COOKIE } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let bodyToken: string | undefined;
  try {
    const json = (await req.json().catch(() => null)) as { refreshToken?: string } | null;
    bodyToken = json?.refreshToken;
  } catch {
    /* ignore */
  }
  const cookieToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const token = bodyToken ?? cookieToken;
  if (token) await revokeSessionByRefreshToken(token);
  await clearAuthCookies();
  return ok({ loggedOut: true });
}
