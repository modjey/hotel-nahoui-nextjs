import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/auth/api";

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

// POST /api/photobook/photos - Soumission publique d'une photo (modération requise)
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`photobook-submit:${clientKey(req.headers)}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return fail("Trop de soumissions, réessayez plus tard", 429, "RATE_LIMITED");
    }

    const body = await req.json().catch(() => null);
    const { title, description, imageUrl, albumId } = body ?? {};

    if (!imageUrl || typeof imageUrl !== "string") {
      return fail("Image manquante", 400, "MISSING_IMAGE");
    }

    // Seules les images hébergées ici (upload photobook) ou des URLs externes sont acceptées
    if (!imageUrl.startsWith("/uploads/") && !/^https?:\/\//.test(imageUrl)) {
      return fail("URL d'image invalide", 400, "INVALID_IMAGE_URL");
    }

    if (!albumId || typeof albumId !== "string") {
      return fail("Album manquant", 400, "MISSING_ALBUM");
    }

    const album = await prisma.photoAlbum.findFirst({
      where: { id: albumId, isPublished: true },
    });
    if (!album) {
      return fail("Album introuvable", 404, "ALBUM_NOT_FOUND");
    }

    // Associe la photo au compte du visiteur s'il est connecté (optionnel)
    let uploadedBy: string | null = null;
    try {
      const session = await getSession(req);
      uploadedBy = session?.userId ?? null;
    } catch {
      uploadedBy = null;
    }

    const baseSlug = slugify(title || "photo") || "photo";
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.photo.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const photo = await prisma.photo.create({
      data: {
        slug,
        title: title?.trim() || null,
        description: description?.trim() || null,
        imageUrl,
        albumId,
        uploadedBy,
        isApproved: false, // modération requise
        isFeatured: false,
      },
    });

    return ok({ photo }, { status: 201 });
  } catch (error) {
    console.error("Error submitting photo:", error);
    return fail("Erreur lors de la soumission", 500);
  }
}
