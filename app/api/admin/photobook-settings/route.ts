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

    let settings = await prisma.photobookSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.photobookSettings.create({
        data: {
          allowDownloads: true,
          requireBookingForDownload: true,
          watermarkEnabled: false,
          watermarkText: "Hotel Nahoui",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching photobook settings:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des paramètres" },
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

    let settings = await prisma.photobookSettings.findFirst();

    if (settings) {
      settings = await prisma.photobookSettings.update({
        where: { id: settings.id },
        data: body,
      });
    } else {
      settings = await prisma.photobookSettings.create({
        data: body,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error saving photobook settings:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la sauvegarde des paramètres" },
      { status: 500 }
    );
  }
}
