import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
  const result = await sendEmail({
    to: 'abrogoualionel@gmail.com',
    subject: 'Test Email from Hotel Nahoui',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Test Email</h1>
        <p>Ceci est un email de test depuis votre application Hotel Nahoui.</p>
        <p>Si vous recevez cet email, le service Resend est correctement configuré!</p>
        <br>
        <p style="color: #666; font-size: 14px;">Envoyé depuis Hotel Nahoui Next.js App</p>
      </div>
    `,
  });

  if (result.success) {
    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      data: result.data 
    });
  }

  return NextResponse.json({ 
    success: false, 
    message: 'Erreur lors de l\'envoi de l\'email',
    error: result.error 
  }, { status: 500 });
}
