import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
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
