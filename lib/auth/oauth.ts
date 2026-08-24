import { authConfig } from "./config";
import { prisma } from "@/lib/prisma";
import type { AuthProvider } from "@prisma/client";

export interface OAuthProfile {
  provider: AuthProvider;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

/* ------------------------------- Google ----------------------------------- */

export function googleAuthUrl(state: string, redirectUri?: string) {
  const r = redirectUri ?? `${authConfig.appUrl}/api/auth/oauth/google/callback`;
  const params = new URLSearchParams({
    client_id: authConfig.google.clientId,
    redirect_uri: r,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<OAuthProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: authConfig.google.clientId,
      client_secret: authConfig.google.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error(`google token exchange failed: ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token: string; id_token: string };

  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userRes.ok) throw new Error(`google userinfo failed: ${userRes.status}`);
  const user = (await userRes.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  return {
    provider: "GOOGLE",
    providerAccountId: user.sub,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.picture ?? null,
  };
}

/* ------------------------------- Facebook --------------------------------- */

export function facebookAuthUrl(state: string, redirectUri?: string) {
  const r = redirectUri ?? `${authConfig.appUrl}/api/auth/oauth/facebook/callback`;
  const params = new URLSearchParams({
    client_id: authConfig.facebook.clientId,
    redirect_uri: r,
    state,
    scope: "email,public_profile",
    response_type: "code",
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeFacebookCode(code: string, redirectUri: string): Promise<OAuthProfile> {
  const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", authConfig.facebook.clientId);
  tokenUrl.searchParams.set("client_secret", authConfig.facebook.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) throw new Error(`facebook token exchange failed: ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(token.access_token)}`,
  );
  if (!userRes.ok) throw new Error(`facebook userinfo failed: ${userRes.status}`);
  const user = (await userRes.json()) as {
    id: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };

  return {
    provider: "FACEBOOK",
    providerAccountId: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.picture?.data?.url ?? null,
  };
}

/* --------------------- Upsert user from OAuth profile --------------------- */

export async function upsertUserFromOAuth(profile: OAuthProfile) {
  // 1) existing linked account?
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });
  if (existingAccount) return existingAccount.user;

  // 2) match by verified email if present
  let user = profile.email
    ? await prisma.user.findUnique({ where: { email: profile.email } })
    : null;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        emailVerified: profile.email ? new Date() : null,
        name: profile.name,
        image: profile.image,
        role: "USER",
      },
    });
  }

  await prisma.account.create({
    data: {
      userId: user.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
    },
  });

  return user;
}
