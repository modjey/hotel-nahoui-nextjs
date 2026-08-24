import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get("albumId");
    const locationId = searchParams.get("locationId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const isApproved = searchParams.get("isApproved");
    const isFeatured = searchParams.get("isFeatured");

    const where: any = {};

    if (isApproved === "true") {
      where.isApproved = true;
    }

    if (isFeatured === "true") {
      where.isFeatured = true;
    }

    if (albumId && albumId !== "all") {
      where.albumId = albumId;
    }

    if (locationId && locationId !== "all") {
      where.album = {
        locationId: locationId,
      };
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    const photos = await prisma.photo.findMany({
      where,
      include: {
        album: {
          include: {
            location: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // Increment view counts for all photos
    await prisma.photo.updateMany({
      where: {
        id: {
          in: photos.map((p: any) => p.id),
        },
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { photos },
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des photos" },
      { status: 500 }
    );
  }
}
