import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const session = await getSession(req);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.photoLike.findUnique({
      where: {
        userId_photoId: {
          userId: session.userId,
          photoId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.photoLike.delete({
        where: { id: existingLike.id },
      });

      // Update photo like count
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: Math.max(0, photo?.likeCount || 0),
      });
    } else {
      // Like
      await prisma.photoLike.create({
        data: {
          userId: session.userId,
          photoId,
        },
      });

      // Update photo like count
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });

      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount: photo?.likeCount || 1,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du like" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const session = await getSession(req);

    if (!session?.userId) {
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: photo?.likeCount || 0,
      });
    }

    const like = await prisma.photoLike.findUnique({
      where: {
        userId_photoId: {
          userId: session.userId,
          photoId,
        },
      },
    });

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    return NextResponse.json({
      success: true,
      liked: !!like,
      likeCount: photo?.likeCount || 0,
    });
  } catch (error) {
    console.error("Error fetching like status:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du like" },
      { status: 500 }
    );
  }
}
