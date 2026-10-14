import { NextResponse, type NextRequest } from "next/server";
import { reqMeta } from "@/lib/auth/api";
import { exchangeGoogleCode, upsertUserFromOAuth } from "@/lib/auth/oauth";
import { issueTokens, setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Web callback after Google redirect. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get("nh_oauth_state")?.value;
  const origin = req.nextUrl.origin;
  const callbackUrl = req.cookies.get("nh_oauth_callback")?.value || `${origin}/?auth=success`;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?auth_error=oauth_state`);
  }

  try {
    const profile = await exchangeGoogleCode(
      code,
      `${origin}/api/auth/oauth/google/callback`,
    );
    const user = await upsertUserFromOAuth(profile);
    if (!user.isActive) {
      return NextResponse.redirect(`${origin}/?auth_error=account_disabled`);
    }
    const tokens = await issueTokens(user, reqMeta(req));
    await setAuthCookies(tokens);
    const res = NextResponse.redirect(callbackUrl);
    res.cookies.delete("nh_oauth_state");
    res.cookies.delete("nh_oauth_callback");
    return res;
  } catch (err) {
    console.error("[oauth google callback]", err);
    return NextResponse.redirect(`${origin}/?auth_error=google`);
  }
}
