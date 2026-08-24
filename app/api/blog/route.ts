import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured");

    const where: any = {
      isPublished: true,
    };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: { posts },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des articles" },
      { status: 500 }
    );
  }
}
