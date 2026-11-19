import { prisma } from "@/lib/prisma";
import { escapeHtml, sendEmail } from "@/lib/email";
import { appUrl, fmtDate, fmtMoney, layout, paragraphs, row } from "@/lib/email-templates";
import { HOTEL_CONTACT } from "@/lib/hotel-contact";
import { ORGANIZATION } from "@/lib/seo";
import { priceStayForRoom } from "@/lib/stay-pricing-server";

/**
 * Emails transactionnels envoyés au client au fil de sa réservation, en complément
 * des emails de statut (reçue, confirmée, annulée, terminée) de `lib/email.ts` :
 * paiement reçu, remboursement, paiement échoué, demande expirée, réservation
 * modifiée, rappel avant l'arrivée.
 * Ne lèvent jamais d'exception : un email raté ne doit pas faire échouer l'action.
 */

export type BookingEmailEvent =
  | { type: "PAYMENT_RECEIVED"; paymentId: string; confirmed?: boolean }
  | { type: "PAYMENT_REFUNDED"; paymentId: string }
  | { type: "PAYMENT_FAILED"; paymentId: string }
  | { type: "HOLD_EXPIRED" }
  | { type: "MODIFIED"; changes: string[] }
  | { type: "ARRIVAL_REMINDER" };

const METHOD_LABELS: Record<string, string> = {
  CARD: "Carte bancaire",
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Virement",
  CASH: "Espèces",
  ON_SITE: "Sur place",
};

const nightsBetween = (a: Date, b: Date) => Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));

async function loadBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { email: true, name: true } },
      room: { select: { name: true, slug: true, basePrice: true, currency: true, discountPercent: true, roomTypeId: true, minStay: true } },
      payments: { select: { id: true, amount: true, currency: true, status: true, method: true, reference: true, paidAt: true } },
    },
  });
}

type LoadedBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

function stayRows(b: LoadedBooking) {
  const nights = nightsBetween(b.checkIn, b.checkOut);
  return `
    ${row("Référence", b.reference ?? "—")}
    ${row("Chambre", b.room?.name ?? "—")}
    ${row("Arrivée", fmtDate(b.checkIn))}
    ${row("Départ", fmtDate(b.checkOut))}
    ${row("Durée", `${nights} nuit${nights > 1 ? "s" : ""}`)}
    ${row("Voyageurs", `${b.adults} adulte${b.adults > 1 ? "s" : ""}${b.children ? `, ${b.children} enfant${b.children > 1 ? "s" : ""}` : ""}`)}`;
}

async function amounts(b: LoadedBooking) {
  const currency = b.room?.currency ?? "XOF";
  const total = b.room ? (await priceStayForRoom(b.room, b.checkIn, b.checkOut)).total : 0;
  const paid = b.payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);
  return { currency, total, paid, remaining: Math.max(0, total - paid) };
}

const table = (inner: string) => `<table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">${inner}</table>`;
const bookingsCta = () => (appUrl() ? { label: "Voir ma réservation", href: `${appUrl()}/bookings` } : undefined);
const whatsappCta = (text: string) => ({ label: "Écrire sur WhatsApp", href: `${HOTEL_CONTACT.whatsappUrl}&text=${encodeURIComponent(text)}` });

async function build(b: LoadedBooking, event: BookingEmailEvent): Promise<{ subject: string; heading: string; body: string; cta?: { label: string; href: string } } | null> {
  const ref = b.reference ? ` ${b.reference}` : "";
  const payment = "paymentId" in event ? b.payments.find((p) => p.id === event.paymentId) : undefined;

  switch (event.type) {
    case "PAYMENT_RECEIVED": {
      if (!payment) return null;
      const m = await amounts(b);
      return {
        subject: event.confirmed ? `Paiement reçu, réservation${ref} confirmée` : `Paiement reçu pour votre réservation${ref}`,
        heading: event.confirmed ? "Paiement reçu, réservation confirmée" : "Paiement reçu",
        body: `
          ${paragraphs(
            event.confirmed
              ? "Nous avons bien reçu votre règlement : votre réservation est confirmée. Nous avons hâte de vous accueillir."
              : "Nous avons bien reçu votre règlement. Merci !",
          )}
          ${table(`
            ${row("Montant reçu", fmtMoney(payment.amount, payment.currency))}
            ${row("Moyen de paiement", METHOD_LABELS[payment.method] ?? payment.method)}
            ${row("Date", fmtDate(payment.paidAt ?? new Date()))}
            ${row("Référence du paiement", payment.reference)}
            ${m.total ? row("Total du séjour", fmtMoney(m.total, m.currency)) : ""}
            ${m.total ? row("Total réglé", fmtMoney(m.paid, m.currency)) : ""}
            ${m.total ? row("Reste à régler", m.remaining > 0 ? fmtMoney(m.remaining, m.currency) : "Rien, le séjour est soldé") : ""}
          `)}
          ${table(stayRows(b))}`,
        cta: bookingsCta(),
      };
    }
    case "PAYMENT_REFUNDED":
      if (!payment) return null;
      return {
        subject: `Remboursement de votre paiement${ref}`,
        heading: "Paiement remboursé",
        body: `
          ${paragraphs("Votre paiement a été remboursé. Selon votre moyen de paiement, le montant peut mettre quelques jours à apparaître sur votre compte.")}
          ${table(`
            ${row("Montant remboursé", fmtMoney(payment.amount, payment.currency))}
            ${row("Moyen de paiement", METHOD_LABELS[payment.method] ?? payment.method)}
            ${row("Référence du paiement", payment.reference)}
          `)}
          ${table(stayRows(b))}`,
        cta: whatsappCta(`Bonjour, une question sur le remboursement de ma réservation${ref}`),
      };
    case "PAYMENT_FAILED":
      if (!payment) return null;
      return {
        subject: `Votre paiement n'a pas abouti${ref}`,
        heading: "Paiement non abouti",
        body: `
          ${paragraphs(
            b.status === "CANCELLED"
              ? "Votre paiement n'a pas abouti et votre demande de réservation a été annulée. Vous pouvez refaire une demande sur notre site ou nous contacter directement."
              : "Votre paiement n'a pas abouti. Aucun montant n'a été prélevé. Vous pouvez réessayer, ou nous contacter pour régler autrement (espèces, Mobile Money, virement).",
          )}
          ${table(`${row("Montant", fmtMoney(payment.amount, payment.currency))}${row("Référence du paiement", payment.reference)}`)}
          ${table(stayRows(b))}`,
        cta: whatsappCta(`Bonjour, mon paiement pour la réservation${ref} n'a pas abouti`),
      };
    case "HOLD_EXPIRED":
      return {
        subject: `Votre demande de réservation${ref} a expiré`,
        heading: "Demande expirée",
        body: `
          ${paragraphs("Faute de règlement dans le délai prévu, votre demande de réservation a expiré et la chambre a été libérée. Si vous souhaitez toujours séjourner chez nous, refaites une demande ou contactez-nous : nous vérifierons les disponibilités avec vous.")}
          ${table(stayRows(b))}`,
        cta: appUrl() ? { label: "Refaire une demande", href: `${appUrl()}/stays${b.room?.slug ? `/${b.room.slug}` : ""}` } : whatsappCta(`Bonjour, ma demande${ref} a expiré, je souhaite toujours réserver`),
      };
    case "MODIFIED": {
      if (!event.changes.length) return null;
      const m = await amounts(b);
      return {
        subject: `Votre réservation${ref} a été modifiée`,
        heading: "Réservation modifiée",
        body: `
          ${paragraphs("Votre réservation a été mise à jour par notre équipe. Voici le détail à jour.")}
          <p style="font-size:13px;color:#6B655A;margin:0 0 8px;">Modifié : ${escapeHtml(event.changes.join(", "))}</p>
          ${table(`${stayRows(b)}${m.total ? row("Total du séjour", fmtMoney(m.total, m.currency)) : ""}${m.paid ? row("Reste à régler", fmtMoney(m.remaining, m.currency)) : ""}`)}
          ${paragraphs("Si ces informations ne correspondent pas à votre demande, répondez simplement à cet email.")}`,
        cta: bookingsCta(),
      };
    }
    case "ARRIVAL_REMINDER": {
      const m = await amounts(b);
      return {
        subject: `Votre séjour approche${ref}`,
        heading: "À très bientôt",
        body: `
          ${paragraphs(`Votre arrivée est prévue le ${fmtDate(b.checkIn)}. Toute l'équipe de l'hôtel se prépare à vous accueillir.`)}
          ${table(`
            ${stayRows(b)}
            ${m.remaining > 0 ? row("Reste à régler", `${fmtMoney(m.remaining, m.currency)} (à l'arrivée)`) : ""}
            ${row("Adresse", `${ORGANIZATION.address.streetAddress}, ${ORGANIZATION.address.addressLocality}`)}
            ${row("Téléphone", HOTEL_CONTACT.phones[0])}
          `)}
          ${paragraphs("Un retard, une arrivée tardive ou une demande particulière (lit bébé, transfert…) ? Prévenez-nous, nous nous organisons.")}`,
        cta: whatsappCta(`Bonjour, je confirme mon arrivée pour la réservation${ref}`),
      };
    }
  }
}

/** Envoie l'email correspondant à l'événement. Renvoie true si l'email est parti. */
export async function sendBookingEmail(bookingId: string, event: BookingEmailEvent): Promise<boolean> {
  try {
    const booking = await loadBooking(bookingId);
    const to = booking?.guestEmail || booking?.user?.email;
    if (!booking || !to) return false;
    const content = await build(booking, event);
    if (!content) return false;
    const greeting = [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || booking.user?.name || "cher client";
    const res = await sendEmail({
      to,
      subject: `${content.subject} - ${HOTEL_CONTACT.name}`,
      html: layout({ heading: content.heading, greeting, body: content.body, cta: content.cta }),
    });
    return res.success;
  } catch (e) {
    console.error(`[booking-emails] ${event.type} failed for ${bookingId}:`, e);
    return false;
  }
}
