import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/session";

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

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Titre et contenu requis" },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const slugTaken = await prisma.blogPost.findUnique({ where: { slug: finalSlug } });
    if (slugTaken) {
      return NextResponse.json(
        { success: false, error: "Un article avec ce slug existe déjà" },
        { status: 409 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        slug: finalSlug,
        title,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        publishedAt: isPublished ? new Date() : null,
        categoryId: categoryId || null,
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
