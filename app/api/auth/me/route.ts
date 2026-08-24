import type { NextRequest } from "next/server";
import { ok, serializeUser, withAuth } from "@/lib/auth/api";

export const runtime = "nodejs";

export const GET = withAuth(async (_req: NextRequest, { session }) => {
  return ok({ user: serializeUser(session.user) });
});
