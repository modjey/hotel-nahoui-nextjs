import type { NextRequest } from "next/server";
import { fail } from "@/lib/auth/api";
import { itemRoutes } from "@/lib/admin-crud";
import { adminResources } from "@/lib/admin-resources";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ resource: string; id: string }> };

const routes = Object.fromEntries(
  Object.entries(adminResources).map(([key, cfg]) => [key, itemRoutes(cfg)]),
) as Record<string, ReturnType<typeof itemRoutes>>;

/** GET / PATCH / DELETE /api/admin/content/[resource]/[id] */
export async function GET(req: NextRequest, { params }: Ctx) {
  const r = routes[(await params).resource];
  return r ? r.GET(req) : fail("Ressource inconnue", 404, "NOT_FOUND");
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const r = routes[(await params).resource];
  return r ? r.PATCH(req) : fail("Ressource inconnue", 404, "NOT_FOUND");
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const r = routes[(await params).resource];
  return r ? r.DELETE(req) : fail("Ressource inconnue", 404, "NOT_FOUND");
}
