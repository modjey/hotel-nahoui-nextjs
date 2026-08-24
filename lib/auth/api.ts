import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import type { User } from "@prisma/client";
import { getSession, hasRole, type AuthSession } from "./session";
import type { Role } from "@prisma/client";

/**
 * Standard JSON success response.
 * Shape used by both web and mobile clients.
 */
export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);

export const fail = (message: string, status = 400, code?: string) =>
  NextResponse.json({ success: false, error: { code: code ?? "ERROR", message } }, { status });

/** Parse JSON body against a Zod schema. */
export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false as const, response: fail("Body JSON invalide", 400, "BAD_JSON") };
  }
  const r = schema.safeParse(json);
  if (!r.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Données invalides",
            issues: (r.error as ZodError).flatten(),
          },
        },
        { status: 422 },
      ),
    };
  }
  return { ok: true as const, data: r.data };
}

/** Public-safe user payload returned to clients. */
export function serializeUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: u.name,
    image: u.image,
    role: u.role,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    createdAt: u.createdAt,
  };
}

/** Wrap a route handler to enforce auth (and optionally roles). */
export function withAuth(
  handler: (req: NextRequest, ctx: { session: AuthSession }) => Promise<Response>,
  opts: { roles?: Role[] } = {},
) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    if (!session) return fail("Non authentifié", 401, "UNAUTHENTICATED");
    if (opts.roles && opts.roles.length > 0 && !hasRole(session, ...opts.roles)) {
      return fail("Accès refusé", 403, "FORBIDDEN");
    }
    return handler(req, { session });
  };
}

export function reqMeta(req: NextRequest) {
  return {
    userAgent: req.headers.get("user-agent"),
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
    device: req.headers.get("x-client-platform") ?? "web", // mobile may send "ios"/"android"
  };
}
