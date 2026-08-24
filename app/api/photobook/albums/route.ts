import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublished = searchParams.get("isPublished") === "true";
    const locationId = searchParams.get("locationId");

    const where: any = {};
    if (isPublished) {
      where.isPublished = true;
    }
    if (locationId) {
      where.locationId = locationId;
    }

    const albums = await prisma.photoAlbum.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        _count: {
          select: { photos: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: { albums },
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des albums",
      },
      { status: 500 }
    );
  }
}
