import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const session = await getSession(req);

    // Get photobook settings
    const settings = await prisma.photobookSettings.findFirst();
    const allowDownloads = settings?.allowDownloads ?? true;
    const requireBooking = settings?.requireBookingForDownload ?? true;

    // Check if downloads are allowed
    if (!allowDownloads) {
      return NextResponse.json(
        { success: false, error: "Les téléchargements sont désactivés" },
        { status: 403 }
      );
    }

    // Check if user is authenticated
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Connexion requise pour télécharger" },
        { status: 401 }
      );
    }

    // Get photo details
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        album: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo introuvable" },
        { status: 404 }
      );
    }

    // Check if user has a booking at the location (stay history)
    // Admins can download regardless
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN" || session.role === "MODERATOR";
    
    if (requireBooking && !isAdmin && photo.album.locationId) {
      const hasBooking = await prisma.booking.findFirst({
        where: {
          userId: session.userId,
          room: {
            locationId: photo.album.locationId,
          },
          status: "COMPLETED",
        },
      });

      if (!hasBooking) {
        return NextResponse.json(
          { success: false, error: "Vous devez avoir séjourné à cet établissement pour télécharger les photos" },
          { status: 403 }
        );
      }
    }

    // Increment download count
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    // Return the image URL (client will handle the actual download)
    return NextResponse.json({
      success: true,
      imageUrl: photo.imageUrl,
      filename: `${photo.slug || photo.id}.jpg`,
    });
  } catch (error) {
    console.error("Error downloading photo:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du téléchargement" },
      { status: 500 }
    );
  }
}
