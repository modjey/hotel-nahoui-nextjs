import { escapeHtml, sendEmail } from "@/lib/email";
import { HOTEL_CONTACT } from "@/lib/hotel-contact";
import type { BookingProforma } from "@/lib/proforma";

/**
 * Emails envoyés depuis l'admin : réponse à un message, relance d'une demande,
 * facture proforma, devis groupe / séminaire. Même charte que les emails de réservation.
 */

export const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const fmtMoney = (n: number, currency = "XOF") =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ")} ${currency === "XOF" ? "FCFA" : currency}`;

/** Texte saisi (réponse, notes) → HTML sûr, sauts de ligne conservés. */
export const paragraphs = (text: string) =>
  escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="font-size:14px;color:#1E1B16;margin:0 0 12px;line-height:1.55;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

export function layout({ heading, greeting, body, cta }: { heading: string; greeting: string; body: string; cta?: { label: string; href: string } }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#F8F6F0;">
      <div style="background:#2F4538;padding:20px 24px;">
        <h1 style="color:#F8F6F0;font-size:18px;margin:0;">${escapeHtml(heading)}</h1>
        <p style="color:#C9C2B4;font-size:13px;margin:6px 0 0;">Hôtel Nahoui Balmer</p>
      </div>
      <div style="background:#ffffff;padding:20px 16px;">
        <p style="font-size:14px;color:#1E1B16;margin:0 0 16px;">Bonjour ${escapeHtml(greeting)},</p>
        ${body}
      </div>
      ${
        cta
          ? `<div style="padding:16px 12px;text-align:center;"><a href="${cta.href}" style="display:inline-block;background:#2F4538;color:#F8F6F0;text-decoration:none;padding:10px 24px;font-size:14px;">${escapeHtml(cta.label)}</a></div>`
          : ""
      }
      <p style="font-size:12px;color:#6B655A;text-align:center;margin:12px 0 0;">
        ${escapeHtml(HOTEL_CONTACT.phones.join(" · "))} · WhatsApp ${escapeHtml(HOTEL_CONTACT.whatsappNumber)} · ${escapeHtml(HOTEL_CONTACT.reservationsEmail)}
      </p>
    </div>`;
}

export const row = (label: string, value: string) => `
  <tr>
    <td style="padding:7px 10px;color:#6B655A;font-size:13px;white-space:nowrap;border-bottom:1px solid #EEE9DF;">${escapeHtml(label)}</td>
    <td style="padding:7px 10px;font-size:14px;color:#1E1B16;border-bottom:1px solid #EEE9DF;">${escapeHtml(value)}</td>
  </tr>`;

/** Réponse de l'hôtel à un message reçu via le formulaire de contact. */
export function sendContactReplyEmail(input: { to: string; name: string; subject: string; originalMessage: string; reply: string }) {
  const body = `
    ${paragraphs(input.reply)}
    <div style="margin-top:20px;padding:12px;background:#F8F6F0;border-left:3px solid #C9C2B4;">
      <p style="font-size:12px;color:#6B655A;margin:0 0 6px;">Votre message :</p>
      <div style="font-size:13px;color:#6B655A;">${escapeHtml(input.originalMessage).replace(/\n/g, "<br>")}</div>
    </div>`;
  return sendEmail({
    to: input.to,
    subject: `Re : ${input.subject}`,
    html: layout({ heading: "Réponse à votre message", greeting: input.name, body }),
  });
}

/** Relance d'un client dont la demande de réservation est en attente de règlement. */
export function sendBookingReminderEmail(input: {
  to: string;
  name: string;
  reference: string | null;
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  total: number;
  currency: string;
  expiresAt: Date | null;
  message?: string | null;
}) {
  const body = `
    ${paragraphs(
      input.message?.trim() ||
        "Nous revenons vers vous au sujet de votre demande de réservation. Pour la confirmer, il reste à convenir du règlement : répondez simplement à cet email, appelez-nous ou écrivez-nous sur WhatsApp.",
    )}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${row("Référence", input.reference ?? "—")}
      ${row("Chambre", input.roomName)}
      ${row("Arrivée", fmtDate(input.checkIn))}
      ${row("Départ", fmtDate(input.checkOut))}
      ${row("Montant du séjour", fmtMoney(input.total, input.currency))}
      ${input.expiresAt ? row("Chambre réservée jusqu'au", new Date(input.expiresAt).toLocaleString("fr-FR", { timeZone: "UTC", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })) : ""}
    </table>`;
  return sendEmail({
    to: input.to,
    subject: `Votre demande de réservation${input.reference ? ` ${input.reference}` : ""}`,
    html: layout({
      heading: "Votre demande de réservation",
      greeting: input.name,
      body,
      cta: { label: "Écrire sur WhatsApp", href: `${HOTEL_CONTACT.whatsappUrl}&text=${encodeURIComponent(`Bonjour, je souhaite régler ma réservation ${input.reference ?? ""}`)}` },
    }),
  });
}

/** Tableau de la proforma (partagé par l'email et la page imprimable via le même contenu). */
export function proformaHtml(p: BookingProforma) {
  const lines = p.lines
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 10px;font-size:13px;border-bottom:1px solid #EEE9DF;">${escapeHtml(l.label)}<br><span style="color:#6B655A;font-size:12px;">à partir du ${escapeHtml(fmtDate(l.from))}</span></td>
        <td style="padding:8px 10px;font-size:13px;text-align:center;border-bottom:1px solid #EEE9DF;">${l.quantity}</td>
        <td style="padding:8px 10px;font-size:13px;text-align:right;border-bottom:1px solid #EEE9DF;white-space:nowrap;">${escapeHtml(fmtMoney(l.unitPrice, p.currency))}</td>
        <td style="padding:8px 10px;font-size:13px;text-align:right;border-bottom:1px solid #EEE9DF;white-space:nowrap;">${escapeHtml(fmtMoney(l.amount, p.currency))}</td>
      </tr>`,
    )
    .join("");
  const total = (label: string, value: string, strong = false) =>
    `<tr><td colspan="3" style="padding:6px 10px;text-align:right;font-size:13px;${strong ? "font-weight:bold;" : "color:#6B655A;"}">${escapeHtml(label)}</td><td style="padding:6px 10px;text-align:right;font-size:13px;white-space:nowrap;${strong ? "font-weight:bold;" : ""}">${escapeHtml(value)}</td></tr>`;

  return `
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
      ${row("Proforma N°", p.number)}
      ${row("Émise le", fmtDate(p.issuedAt))}
      ${row("Valable jusqu'au", fmtDate(p.validUntil))}
      ${row("Client", p.guest.name)}
      ${row("Séjour", `${fmtDate(p.booking.checkIn)} → ${fmtDate(p.booking.checkOut)} (${p.booking.nights} nuit${p.booking.nights > 1 ? "s" : ""})`)}
      ${row("Voyageurs", `${p.booking.adults} adulte(s)${p.booking.children ? `, ${p.booking.children} enfant(s)` : ""}`)}
    </table>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#F8F6F0;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B655A;">Désignation</th>
          <th style="padding:8px 10px;text-align:center;font-size:12px;color:#6B655A;">Nuits</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:#6B655A;">Prix / nuit</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;color:#6B655A;">Montant</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
      <tfoot>
        ${total("Total", fmtMoney(p.total, p.currency), true)}
        ${p.paid > 0 ? total("Déjà réglé", fmtMoney(p.paid, p.currency)) : ""}
        ${p.paid > 0 ? total("Reste à payer", fmtMoney(p.remaining, p.currency), true) : ""}
      </tfoot>
    </table>
    ${p.hotel.paymentDetails ? `<p style="font-size:13px;color:#1E1B16;margin:16px 0 4px;"><strong>Modalités de règlement</strong></p>${paragraphs(p.hotel.paymentDetails)}` : ""}
    ${p.hotel.footerNote ? `<p style="font-size:12px;color:#6B655A;margin:12px 0 0;">${escapeHtml(p.hotel.footerNote)}</p>` : ""}`;
}

export function sendProformaEmail(p: BookingProforma, to: string) {
  const body = `
    <p style="font-size:14px;color:#1E1B16;margin:0 0 12px;">Veuillez trouver ci-dessous la facture proforma de votre séjour.</p>
    ${proformaHtml(p)}`;
  return sendEmail({
    to,
    subject: `Facture proforma ${p.number} - Hôtel Nahoui Balmer`,
    html: layout({ heading: "Facture proforma", greeting: p.guest.name, body, cta: appUrl() ? { label: "Conditions de réservation", href: `${appUrl()}/conditions` } : undefined }),
  });
}

const QUOTE_TYPES: Record<string, string> = { GROUPE: "séjour de groupe", SEMINAIRE: "séminaire", EVENEMENT: "événement" };

/** Devis envoyé pour une demande de groupe / séminaire / événement. */
export function sendQuoteEmail(q: {
  email: string;
  contactName: string;
  reference: string;
  type: string;
  startDate: Date | null;
  endDate: Date | null;
  guests: number | null;
  rooms: number | null;
  quoteAmount: number | null;
  quoteNotes: string | null;
}) {
  const body = `
    <p style="font-size:14px;color:#1E1B16;margin:0 0 12px;">Merci pour votre demande de ${escapeHtml(QUOTE_TYPES[q.type] ?? "devis")}. Voici notre proposition.</p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
      ${row("Devis N°", q.reference)}
      ${q.startDate ? row("Dates", `${fmtDate(q.startDate)}${q.endDate ? ` → ${fmtDate(q.endDate)}` : ""}`) : ""}
      ${q.guests ? row("Participants", String(q.guests)) : ""}
      ${q.rooms ? row("Chambres", String(q.rooms)) : ""}
      ${q.quoteAmount != null ? row("Montant total", fmtMoney(q.quoteAmount)) : ""}
    </table>
    ${q.quoteNotes ? paragraphs(q.quoteNotes) : ""}
    <p style="font-size:14px;color:#1E1B16;margin:12px 0 0;">Pour accepter ce devis ou l'ajuster, répondez simplement à cet email.</p>`;
  return sendEmail({
    to: q.email,
    subject: `Votre devis ${q.reference} - Hôtel Nahoui Balmer`,
    html: layout({ heading: "Votre devis", greeting: q.contactName, body }),
  });
}
