import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Article introuvable" },
        { status: 404 }
      );
    }

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;
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

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        slug: finalSlug,
        title,
        excerpt,
        content,
        coverImage,
        isPublished,
        isFeatured,
        publishedAt: isPublished && !body.wasPublished ? new Date() : undefined,
        categoryId,
        order,
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
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de l'article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Article supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de l'article" },
      { status: 500 }
    );
  }
}
