import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { authConfig, ACCESS_COOKIE, REFRESH_COOKIE } from "./config";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";
import type { Role, User } from "@prisma/client";
import type { NextRequest } from "next/server";

export interface AuthSession {
  userId: string;
  role: Role;
  email: string | null;
  phone: string | null;
  user: User;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;          // access token seconds
  refreshExpiresAt: string;   // ISO
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Create a Session row + signed access/refresh tokens.
 * Used by every login flow (OTP, OAuth, password).
 */
export async function issueTokens(
  user: Pick<User, "id" | "role" | "email" | "phone">,
  meta: { userAgent?: string | null; ipAddress?: string | null; device?: string | null } = {},
): Promise<IssuedTokens> {
  const sessionId = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + authConfig.refreshTokenTtlDays * 86400 * 1000);

  const refreshToken = await signRefreshToken({ sub: user.id, sid: sessionId });

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: sha256(refreshToken),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      device: meta.device ?? "web",
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  });

  // Best-effort timestamp update
  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

  // Parse access TTL into seconds for clients (mobile)
  const ttl = authConfig.accessTokenTtl;
  const m = /^(\d+)([smhd])$/.exec(ttl);
  const mult = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  const expiresIn = m ? Number(m[1]) * mult[m[2] as keyof typeof mult] : 900;

  return { accessToken, refreshToken, expiresIn, refreshExpiresAt: expiresAt.toISOString() };
}

export async function rotateRefreshToken(refreshToken: string): Promise<IssuedTokens | null> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.refreshTokenHash !== sha256(refreshToken)) {
    // Token reuse / theft suspected — revoke session
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }
  if (!session.user.isActive) return null;

  const newRefresh = await signRefreshToken({ sub: session.userId, sid: session.id });
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: sha256(newRefresh) },
  });

  const accessToken = await signAccessToken({
    sub: session.userId,
    role: session.user.role,
    email: session.user.email,
    phone: session.user.phone,
  });

  const ttl = authConfig.accessTokenTtl;
  const m = /^(\d+)([smhd])$/.exec(ttl);
  const mult = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  const expiresIn = m ? Number(m[1]) * mult[m[2] as keyof typeof mult] : 900;

  return {
    accessToken,
    refreshToken: newRefresh,
    expiresIn,
    refreshExpiresAt: session.expiresAt.toISOString(),
  };
}

export async function revokeSessionByRefreshToken(refreshToken: string) {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return;
  await prisma.session
    .update({ where: { id: payload.sid }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

/* ----------------------------- Cookie helpers ----------------------------- */

export async function setAuthCookies(tokens: IssuedTokens) {
  const jar = await cookies();
  const common = {
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: "lax" as const,
    domain: authConfig.cookieDomain,
    path: "/",
  };
  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...common, maxAge: tokens.expiresIn });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: authConfig.refreshTokenTtlDays * 86400,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/* ----------------------------- Get current user ---------------------------- */

/**
 * Reads the current session from either:
 * - HttpOnly cookie (web)
 * - Authorization: Bearer <accessToken> header (mobile / REST clients)
 */
export async function getSession(req?: NextRequest): Promise<AuthSession | null> {
  let token: string | undefined;

  if (req) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    if (!token) token = req.cookies.get(ACCESS_COOKIE)?.value;
  } else {
    const jar = await cookies();
    token = jar.get(ACCESS_COOKIE)?.value;
  }
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;

  return {
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    user,
  };
}

export function hasRole(session: AuthSession | null, ...roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

export function isAdmin(session: AuthSession | null): boolean {
  return hasRole(session, "ADMIN", "SUPER_ADMIN", "MODERATOR");
}
