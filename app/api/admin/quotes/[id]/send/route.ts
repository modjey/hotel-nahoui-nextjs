import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { sendQuoteEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

/** POST /api/admin/quotes/[id]/send — envoie le devis au client et passe la demande en « Devis envoyé ». */
export const POST = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? "";
  try {
    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) return fail("Demande introuvable", 404, "NOT_FOUND");
    if (quote.quoteAmount == null && !quote.quoteNotes) {
      return fail("Renseignez le montant ou le détail du devis avant de l'envoyer", 400, "EMPTY_QUOTE");
    }
    const result = await sendQuoteEmail(quote);
    if (!result.success) return fail("L'email n'a pas pu être envoyé", 502, "EMAIL_FAILED");
    const item = await prisma.quoteRequest.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    return ok({ item });
  } catch (e) {
    console.error("[POST quote send]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
