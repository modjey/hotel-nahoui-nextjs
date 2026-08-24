import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { z } from "zod";

export const runtime = "nodejs";

const reviewStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

const handler = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (req.method === "GET") {
    try {
      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            room: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      return ok({ reviews, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      return fail("Failed to fetch reviews", 500, "FETCH_FAILED");
    }
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET };
