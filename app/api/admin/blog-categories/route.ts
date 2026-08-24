import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const categories = await prisma.blogCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des catégories" },
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
    const { name, slug, description, order } = body;

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug: finalSlug,
        description,
        order: order ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error("Error creating blog category:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}
