import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { authConfig } from "./config";
import type { Role } from "@prisma/client";

const encoder = new TextEncoder();
const secret = () => encoder.encode(authConfig.jwtSecret);

export interface AccessTokenPayload extends JWTPayload {
  sub: string;        // user id
  role: Role;
  email?: string | null;
  phone?: string | null;
  typ: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  sid: string;        // session id
  typ: "refresh";
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, "typ" | "iat" | "exp">) {
  return new SignJWT({ ...payload, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(authConfig.accessTokenTtl)
    .sign(secret());
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, "typ" | "iat" | "exp">) {
  return new SignJWT({ ...payload, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${authConfig.refreshTokenTtlDays}d`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== "access") return null;
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== "refresh") return null;
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}
