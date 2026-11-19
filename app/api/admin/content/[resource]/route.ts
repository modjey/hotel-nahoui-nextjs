import type { NextRequest } from "next/server";
import { fail } from "@/lib/auth/api";
import { collectionRoutes } from "@/lib/admin-crud";
import { adminResources } from "@/lib/admin-resources";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ resource: string }> };

const routes = Object.fromEntries(
  Object.entries(adminResources).map(([key, cfg]) => [key, collectionRoutes(cfg)]),
) as Record<string, ReturnType<typeof collectionRoutes>>;

/** GET /api/admin/content/[resource] — liste ; POST — création. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const r = routes[(await params).resource];
  return r ? r.GET(req) : fail("Ressource inconnue", 404, "NOT_FOUND");
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const r = routes[(await params).resource];
  return r ? r.POST(req) : fail("Ressource inconnue", 404, "NOT_FOUND");
}
