import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { z } from "zod";

export const runtime = "nodejs";

const reviewStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = reviewStatusSchema.parse(body);

    const review = await prisma.review.update({
      where: { id },
      data: { status: parsed.status },
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
    });

    return ok({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Invalid request body", 400, "INVALID_BODY");
    }
    console.error("Failed to update review:", error);
    return fail("Failed to update review", 500, "UPDATE_FAILED");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.review.delete({
      where: { id },
    });

    return ok({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return fail("Failed to delete review", 500, "DELETE_FAILED");
  }
}


