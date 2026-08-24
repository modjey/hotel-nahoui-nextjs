import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { 
        slug,
        isPublished: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Article introuvable" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération de l'article" },
      { status: 500 }
    );
  }
}
