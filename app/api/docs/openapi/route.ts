import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";

/** Spec OpenAPI 3.1 servie en JSON, consommée par Swagger UI à /docs. */
export async function GET() {
  return NextResponse.json(buildOpenApiSpec());
}
