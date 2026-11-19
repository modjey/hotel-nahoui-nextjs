import { NextResponse } from "next/server";
import { getPublishedOffers } from "@/lib/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Offres publiées, en cours de validité et cochées « pop-up flash » (lecture publique). */
export async function GET() {
  const offers = await getPublishedOffers({ flashOnly: true, limit: 5 });
  return NextResponse.json(
    { success: true, data: { offers } },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
