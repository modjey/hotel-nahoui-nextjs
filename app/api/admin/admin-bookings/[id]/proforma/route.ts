import { ok, fail, withAuth } from "@/lib/auth/api";
import { buildBookingProforma } from "@/lib/proforma";
import { sendProformaEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

/** POST /api/admin/admin-bookings/[id]/proforma — envoie la proforma par email au client. */
export const POST = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? "";
  try {
    const proforma = await buildBookingProforma(id);
    if (!proforma) return fail("Réservation introuvable", 404, "NOT_FOUND");
    if (!proforma.guest.email) return fail("Aucun email client sur cette réservation", 400, "NO_EMAIL");
    const result = await sendProformaEmail(proforma, proforma.guest.email);
    if (!result.success) return fail("L'email n'a pas pu être envoyé", 502, "EMAIL_FAILED");
    return ok({ sentTo: proforma.guest.email, number: proforma.number });
  } catch (e) {
    console.error("[POST proforma]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
