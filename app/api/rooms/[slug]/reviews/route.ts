import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { z } from "zod";

export const runtime = "nodejs";

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  bookingId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;

  // Verify room exists
  const room = await prisma.room.findUnique({
    where: { slug },
  });

  if (!room) {
    return fail("Chambre introuvable", 404, "NOT_FOUND");
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {
      roomId: room.id,
    };

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
    });

    // Calculate average rating
    const approvedReviews = reviews.filter((r: any) => r.status === "APPROVED");
    const averageRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length
      : 0;

    return ok({
      reviews,
      stats: {
        total: reviews.length,
        approved: approvedReviews.length,
        averageRating: Math.round(averageRating * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return fail("Failed to fetch reviews", 500, "FETCH_FAILED");
  }
}

const postHandler = withAuth(async (req, { session }) => {
  const slug = new URL(req.url).pathname.split('/').slice(-2, -1)[0];

  // Verify room exists
  const room = await prisma.room.findUnique({
    where: { slug },
  });

  if (!room) {
    return fail("Chambre introuvable", 404, "NOT_FOUND");
  }

  try {
    const body = await req.json();
    const parsed = createReviewSchema.parse(body);

    // If bookingId is provided, verify it belongs to this room and the user
    if (parsed.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: parsed.bookingId },
        include: { reviews: true },
      });

      if (!booking || booking.roomId !== room.id) {
        return fail("Réservation introuvable", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.userId !== session.user.id) {
        return fail("Non autorisé", 403, "FORBIDDEN");
      }

      // Check if review already exists for this booking
      if (booking.reviews.length > 0) {
        return fail("Un avis existe déjà pour cette réservation", 400, "REVIEW_EXISTS");
      }
    }

    // Check if user already reviewed this room
    const existingReview = await prisma.review.findFirst({
      where: {
        roomId: room.id,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return fail("Vous avez déjà laissé un avis pour cette chambre", 400, "ALREADY_REVIEWED");
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        bookingId: parsed.bookingId,
        rating: parsed.rating,
        comment: parsed.comment,
        status: "PENDING", // Requires approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return ok({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Invalid request body", 400, "INVALID_BODY");
    }
    console.error("Failed to create review:", error);
    return fail("Failed to create review", 500, "CREATE_FAILED");
  }
});

export { postHandler as POST };
