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
