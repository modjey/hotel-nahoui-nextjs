import type { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/auth/api";
import { emailSchema } from "@/lib/auth/schemas";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { createAdminNotification } from "@/lib/notifications";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const newsletterSchema = z.object({ email: emailSchema });

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, newsletterSchema);
  if (!parsed.ok) return parsed.response;
  const { email } = parsed.data;

  // Anti-abus : 5 inscriptions par email et 20 par IP toutes les 15 minutes.
  const perEmail = rateLimit(`newsletter:email:${email}`, 5, 15 * 60 * 1000);
  const perIp = rateLimit(`newsletter:ip:${clientKey(req.headers)}`, 20, 15 * 60 * 1000);
  if (!perEmail.ok || !perIp.ok) {
    return fail("Trop de demandes. Réessayez dans quelques minutes.", 429, "TOO_MANY_REQUESTS");
  }

  let user = await prisma.user.findUnique({ where: { email } });
  let created = false;

  if (!user) {
    user = await prisma.user.create({
      data: { email, role: "USER", isActive: true },
    });
    created = true;

    await createAdminNotification({
      type: "NEWSLETTER_SIGNUP",
      title: "Nouvel abonné newsletter",
      message: `${email} s'est inscrit à la newsletter et un compte a été créé.`,
      link: "/admin/users",
    });

    // Best-effort : n'empêche jamais l'inscription de réussir si l'envoi échoue.
    sendEmail({
      to: email,
      subject: "Bienvenue chez l'Hôtel Nahoui Balmer",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F8F6F0;">
          <div style="background:#2F4538;padding:20px 24px;">
            <h1 style="color:#F8F6F0;font-size:18px;margin:0;">Bienvenue</h1>
            <p style="color:#C9C2B4;font-size:13px;margin:6px 0 0;">Hôtel Nahoui Balmer</p>
          </div>
          <div style="background:#ffffff;padding:20px 12px;">
            <p style="font-size:14px;color:#1E1B16;margin:0 0 16px;">Merci de vous être inscrit(e) à nos actualités et offres.</p>
            <p style="font-size:14px;color:#1E1B16;margin:0;">Un compte a été créé avec cette adresse : pour vous connecter à tout moment, demandez simplement un code de connexion par e-mail depuis le site.</p>
          </div>
        </div>`,
    }).catch(() => {});
  }

  return ok({ subscribed: true, created });
}
