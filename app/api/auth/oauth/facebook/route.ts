import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { fail, ok, parseBody, reqMeta, serializeUser } from "@/lib/auth/api";
import { oauthCallbackSchema } from "@/lib/auth/schemas";
import { exchangeFacebookCode, facebookAuthUrl, upsertUserFromOAuth } from "@/lib/auth/oauth";
import { issueTokens, setAuthCookies } from "@/lib/auth/session";
import { authConfig } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const callbackUrl = searchParams.get("callbackUrl") || `${authConfig.appUrl}/`;
  const state = randomBytes(16).toString("hex");
  const url = facebookAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("nh_oauth_state", state, {
    httpOnly: true,
    secure: authConfig.isProd,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  res.cookies.set("nh_oauth_callback", callbackUrl, {
    httpOnly: true,
    secure: authConfig.isProd,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, oauthCallbackSchema);
  if (!parsed.ok) return parsed.response;

  const redirectUri =
    parsed.data.redirectUri ?? `${authConfig.appUrl}/api/auth/oauth/facebook/callback`;
  try {
    const profile = await exchangeFacebookCode(parsed.data.code, redirectUri);
    const user = await upsertUserFromOAuth(profile);
    const tokens = await issueTokens(user, reqMeta(req));
    await setAuthCookies(tokens);
    return ok({
      user: serializeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      refreshExpiresAt: tokens.refreshExpiresAt,
    });
  } catch (err) {
    console.error("[oauth facebook]", err);
    return fail("Échec de la connexion Facebook", 400, "OAUTH_FAILED");
  }
}
