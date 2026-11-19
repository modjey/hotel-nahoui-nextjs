import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/auth/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createAdminNotification } from "@/lib/notifications";
import { generateQuoteReference } from "@/lib/admin-resources";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const dateOrNull = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.date().nullable());
const intOrNull = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(0).max(5000).nullable());

const schema = z
  .object({
    type: z.enum(["GROUPE", "SEMINAIRE", "EVENEMENT"]),
    companyName: z.string().trim().max(160).optional().nullable(),
    contactName: z.string().trim().min(2, "Nom requis").max(160),
    email: z.string().trim().email("Email invalide").max(160),
    phone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 8, "Téléphone invalide"),
    startDate: dateOrNull,
    endDate: dateOrNull,
    guests: intOrNull,
    rooms: intOrNull,
    needs: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, { message: "La date de fin doit suivre la date de début", path: ["endDate"] });

const TYPE_LABEL = { GROUPE: "séjour de groupe", SEMINAIRE: "séminaire", EVENEMENT: "événement" } as const;

/** POST /api/quotes — demande de devis groupe / séminaire / événement (formulaire public). */
export async function POST(req: NextRequest) {
  const limit = rateLimit(`quote:${clientKey(req.headers)}`, 5, 30 * 60 * 1000);
  if (!limit.ok) return fail("Trop de demandes envoyées. Réessayez plus tard.", 429, "TOO_MANY_REQUESTS");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Body JSON invalide", 400, "BAD_JSON");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire incomplet", 422, "VALIDATION");
  const d = parsed.data;

  try {
    const quote = await prisma.quoteRequest.create({
      data: { ...d, companyName: d.companyName || null, needs: d.needs || null, reference: generateQuoteReference() },
    });

    await Promise.allSettled([
      createAdminNotification({
        type: "CONTACT_MESSAGE",
        title: `Demande de devis : ${TYPE_LABEL[d.type]}`,
        message: `${d.contactName}${d.companyName ? ` (${d.companyName})` : ""}${d.guests ? ` · ${d.guests} pers.` : ""}`,
        link: "/admin/quotes",
      }),
      sendEmail({
        to: d.email,
        subject: `Demande de devis ${quote.reference} reçue - Hôtel Nahoui Balmer`,
        text: `Bonjour ${d.contactName},\n\nNous avons bien reçu votre demande de devis pour un ${TYPE_LABEL[d.type]} (référence ${quote.reference}). Notre équipe vous recontacte rapidement avec une proposition.\n\nHôtel Nahoui Balmer`,
      }),
    ]);

    return ok({ reference: quote.reference }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/quotes]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
