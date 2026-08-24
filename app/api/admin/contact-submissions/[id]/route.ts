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

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: "Message introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du message" },
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
    const { status, reply } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "replied" && !reply) {
        updateData.repliedAt = new Date();
        updateData.repliedBy = session.userId;
      }
    }
    if (reply !== undefined) {
      updateData.reply = reply;
      if (reply && status === "replied") {
        updateData.repliedAt = new Date();
        updateData.repliedBy = session.userId;
      }
    }

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    console.error("Error updating contact submission:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du message" },
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

    await prisma.contactSubmission.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Message supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du message" },
      { status: 500 }
    );
  }
}
