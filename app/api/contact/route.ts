import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    // Anti-spam : 5 messages par IP toutes les 10 minutes.
    const limit = rateLimit(`contact:${clientKey(req.headers)}`, 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Trop de messages envoyés. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Body JSON invalide" }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Tous les champs obligatoires doivent être correctement remplis" },
        { status: 422 },
      );
    }

    const { firstName, lastName, email, phone, subject, message } = parsed.data;

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
      { status: 500 },
    );
  }
}
