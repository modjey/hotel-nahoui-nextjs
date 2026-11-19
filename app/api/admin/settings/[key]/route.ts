import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { getSetting, isSettingKey, saveSetting } from "@/lib/site-settings";

export const runtime = "nodejs";

const keyOf = (req: NextRequest) => req.nextUrl.pathname.split("/").pop() ?? "";

/** GET /api/admin/settings/[key] — valeur (avec défauts). */
export const GET = withAuth(async (req) => {
  const key = keyOf(req);
  if (!isSettingKey(key)) return fail("Réglage inconnu", 404, "NOT_FOUND");
  return ok({ value: await getSetting(key) });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

/** PUT /api/admin/settings/[key] — enregistre la valeur complète. */
export const PUT = withAuth(async (req) => {
  const key = keyOf(req);
  if (!isSettingKey(key)) return fail("Réglage inconnu", 404, "NOT_FOUND");
  try {
    const value = await saveSetting(key, await req.json());
    return ok({ value });
  } catch (e) {
    if (e instanceof ZodError) return fail(e.issues[0]?.message ?? "Données invalides", 400, "VALIDATION");
    console.error("[PUT /api/admin/settings]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
