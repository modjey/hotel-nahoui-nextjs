import { NextRequest, NextResponse } from "next/server";
import { createAdminNotification } from "@/lib/notifications";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, subject, message } = body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        subject,
        message,
      },
    });

    await createAdminNotification({
      type: "CONTACT_MESSAGE",
      title: "Nouveau message de contact",
      message: `${firstName} ${lastName} — ${subject}`,
      link: "/admin/contact-submissions",
    });

    return NextResponse.json({
      success: true,
      message: "Message envoyé avec succès",
      data: { id: submission.id },
    });
  } catch (error) {
    console.error("Error creating contact submission:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
