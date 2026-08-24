'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PendingBooking = { roomId: string };

function BookingCancelledContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        setBooking(JSON.parse(pendingBooking));
        localStorage.removeItem('pendingBooking');
      } catch (err) {
        console.error('Error parsing booking data:', err);
      }
    }
    setLoading(false);
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="eyebrow text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <XCircle className="h-8 w-8 mx-auto mb-6 text-destructive" />
          <h1 className="font-display text-4xl font-light mb-3">Paiement annulé</h1>
          <p className="text-muted-foreground">
            Votre paiement a été annulé. Aucun montant n&rsquo;a été débité de votre compte.
          </p>
        </div>

        <div className="border-t border-border pt-8">
          {reference && (
            <div className="mb-8 pb-8 border-b border-border">
              <p className="eyebrow text-muted-foreground mb-1">Numéro de réservation</p>
              <p className="font-mono text-sm">{reference}</p>
            </div>
          )}

          <div className="space-y-6">
            {[
              { n: "1", title: "Votre réservation n'est pas confirmée", text: "Le paiement n'a pas été effectué, donc votre réservation n'est pas validée." },
              { n: "2", title: "Vous pouvez réessayer", text: "Vous pouvez recommencer le processus de réservation à tout moment." },
              { n: "3", title: "Besoin d'aide ?", text: "Contactez notre service client si vous avez rencontré un problème lors du paiement." },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-4">
                <span className="eyebrow text-primary mt-0.5">{step.n}</span>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row gap-8 justify-center items-center">
          <Link href="/" className="link-underline text-foreground">
            <Home className="h-3.5 w-3.5" /> Retour à l&rsquo;accueil
          </Link>
          {booking && (
            <Link href={`/rooms/${booking.roomId}`} className="link-underline text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à la chambre
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="eyebrow text-muted-foreground">Chargement...</p>
      </div>
    }>
      <BookingCancelledContent />
    </Suspense>
  );
}
