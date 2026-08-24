import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return ok({ reviews });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return fail("Failed to fetch reviews", 500, "FETCH_FAILED");
  }
}
