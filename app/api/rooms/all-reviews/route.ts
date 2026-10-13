import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { getSession } from "@/lib/auth/session";
import type { ReviewStatus } from "@prisma/client";

const REVIEW_STATUSES = new Set<ReviewStatus>(["PENDING", "APPROVED", "REJECTED"]);

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedStatus = searchParams.get("status");
    const limitRaw = parseInt(searchParams.get("limit") || "48", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 48;

    // Route publique : seuls les avis approuvés sont visibles. Un admin
    // authentifié peut demander un autre statut.
    const session = await getSession(req);
    const canSeeAll =
      session?.role === "ADMIN" || session?.role === "SUPER_ADMIN" || session?.role === "MODERATOR";
    const status: ReviewStatus =
      canSeeAll && requestedStatus && REVIEW_STATUSES.has(requestedStatus as ReviewStatus)
        ? (requestedStatus as ReviewStatus)
        : "APPROVED";

    const reviews = await prisma.review.findMany({
      where: { status },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return ok({ reviews });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return fail("Failed to fetch reviews", 500, "FETCH_FAILED");
  }
}
