import { NextResponse, type NextRequest } from "next/server";
import { reqMeta } from "@/lib/auth/api";
import { exchangeFacebookCode, upsertUserFromOAuth } from "@/lib/auth/oauth";
import { issueTokens, setAuthCookies } from "@/lib/auth/session";
import { authConfig } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get("nh_oauth_state")?.value;
  const callbackUrl = req.cookies.get("nh_oauth_callback")?.value || `${authConfig.appUrl}/?auth=success`;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${authConfig.appUrl}/?auth_error=oauth_state`);
  }

  try {
    const profile = await exchangeFacebookCode(
      code,
      `${authConfig.appUrl}/api/auth/oauth/facebook/callback`,
    );
    const user = await upsertUserFromOAuth(profile);
    const tokens = await issueTokens(user, reqMeta(req));
    await setAuthCookies(tokens);
    const res = NextResponse.redirect(callbackUrl);
    res.cookies.delete("nh_oauth_state");
    res.cookies.delete("nh_oauth_callback");
    return res;
  } catch (err) {
    console.error("[oauth facebook callback]", err);
    return NextResponse.redirect(`${authConfig.appUrl}/?auth_error=facebook`);
  }
}
