import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isPublished = searchParams.get("isPublished");
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const where: any = {};
    if (isPublished === "true") {
      where.isPublished = true;
    }
    if (isPublished === "false") {
      where.isPublished = false;
    }
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
        },
        orderBy: [{ order: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { posts, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des articles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      slug,
      title,
      excerpt,
      content,
      coverImage,
      isPublished,
      isFeatured,
      categoryId,
      order,
    } = body;

    // Generate slug from title if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const post = await prisma.blogPost.create({
      data: {
        slug: finalSlug,
        title,
        excerpt,
        content,
        coverImage,
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        publishedAt: isPublished ? new Date() : null,
        categoryId,
        authorId: session.userId,
        order: order ?? 0,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de l'article" },
      { status: 500 }
    );
  }
}
