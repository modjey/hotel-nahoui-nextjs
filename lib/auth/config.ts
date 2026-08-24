// Centralized auth configuration. All env-derived constants live here.

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v && process.env.NODE_ENV === "production") {
    throw new Error(`[auth] Missing required env var: ${name}`);
  }
  return v ?? "";
};

export const authConfig = {
  jwtSecret: required("AUTH_JWT_SECRET", "dev-insecure-secret-change-me-please-32chars!!"),
  accessTokenTtl: process.env.AUTH_ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: Number(process.env.AUTH_REFRESH_TOKEN_TTL_DAYS ?? 30),
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  cookieSecure: process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  isProd: process.env.NODE_ENV === "production",

  otp: {
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 10),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
    length: Number(process.env.OTP_LENGTH ?? 6),
    debug: process.env.OTP_DEBUG === "true",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
  },

  tpecloud: {
    apiUrl: process.env.TPECLOUD_API_URL ?? "https://api.tpecloud.com/sms/send",
    apiKey: process.env.TPECLOUD_API_KEY ?? "",
    senderId: process.env.TPECLOUD_SENDER_ID ?? "NAHOUI",
  },
};

export const ACCESS_COOKIE = "nh_access";
export const REFRESH_COOKIE = "nh_refresh";
