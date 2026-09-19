import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
}: EmailOptions) {
  try {
    const emailData: any = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
    };

    if (html) emailData.html = html;
    if (text) emailData.text = text;

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export interface BookingNotificationData {
  reference?: string | null;
  roomName?: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  adults: number;
  children: number;
  status: string;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
}

function formatDateFr(value: Date | string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Envoie une notification email à l'admin à chaque nouvelle réservation.
 * Ne lève jamais d'exception : un échec d'envoi ne doit pas faire échouer la réservation.
 */
export async function sendAdminBookingNotification(booking: BookingNotificationData) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) {
    console.warn('[email] ADMIN_NOTIFICATION_EMAIL non configuré — notification de réservation ignorée');
    return { success: false };
  }

  const guestName =
    [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(' ') || 'Non renseigné';
  const nights = Math.max(
    0,
    Math.round(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000
    )
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 12px;color:#6B655A;font-size:13px;white-space:nowrap;">${label}</td>
      <td style="padding:8px 12px;font-size:14px;color:#1E1B16;">${value}</td>
    </tr>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F8F6F0;">
      <div style="background:#2F4538;padding:20px 24px;">
        <h1 style="color:#F8F6F0;font-size:18px;margin:0;">Nouvelle réservation</h1>
        <p style="color:#C9C2B4;font-size:13px;margin:6px 0 0;">Hôtel Nahoui</p>
      </div>
      <div style="background:#ffffff;padding:8px 12px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Référence', booking.reference || '—')}
          ${row('Chambre', booking.roomName || '—')}
          ${row('Arrivée', formatDateFr(booking.checkIn))}
          ${row('Départ', formatDateFr(booking.checkOut))}
          ${row('Nuits', String(nights))}
          ${row('Voyageurs', `${booking.adults} adulte${booking.adults > 1 ? 's' : ''} · ${booking.children} enfant${booking.children > 1 ? 's' : ''}`)}
          ${row('Client', guestName)}
          ${row('Email', booking.guestEmail || '—')}
          ${row('Téléphone', booking.guestPhone || '—')}
          ${row('Statut', booking.status)}
        </table>
      </div>
      ${
        appUrl
          ? `<div style="padding:16px 12px;text-align:center;">
               <a href="${appUrl}/admin/bookings" style="display:inline-block;background:#2F4538;color:#F8F6F0;text-decoration:none;padding:10px 24px;font-size:14px;">Voir les réservations</a>
             </div>`
          : ''
      }
    </div>`;

  return sendEmail({
    to,
    subject: `Nouvelle réservation — ${booking.roomName || 'Hôtel Nahoui'}${booking.reference ? ` (${booking.reference})` : ''}`,
    html,
  });
}

export async function sendTemplateEmail({
  to,
  subject,
  template,
  from,
}: {
  to: string | string[];
  subject: string;
  template: string;
  from?: string;
}) {
  return sendEmail({
    to,
    subject,
    html: template,
    from,
  });
}
