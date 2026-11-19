import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/session";
import { sendContactReplyEmail } from "@/lib/email-templates";

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

    const updateData: Prisma.ContactSubmissionUpdateInput = {};
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

    // Une réponse est envoyée par email au client avant d'être enregistrée comme « répondue ».
    let emailSent = false;
    if (typeof reply === "string" && reply.trim() && status === "replied") {
      const current = await prisma.contactSubmission.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ success: false, error: "Message introuvable" }, { status: 404 });
      }
      const result = await sendContactReplyEmail({
        to: current.email,
        name: `${current.firstName} ${current.lastName}`.trim(),
        subject: current.subject,
        originalMessage: current.message,
        reply: reply.trim(),
      });
      emailSent = Boolean(result.success);
      if (!emailSent) {
        return NextResponse.json(
          { success: false, error: "L'email n'a pas pu être envoyé : la réponse n'a pas été enregistrée." },
          { status: 502 },
        );
      }
    }

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { submission, emailSent },
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
