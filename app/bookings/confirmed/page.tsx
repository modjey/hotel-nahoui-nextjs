'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, Users, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';

type PendingBooking = {
  total: number;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
  roomId: string;
  guestInfo: { firstName: string; lastName: string; email: string; phone: string };
};

function BookingConfirmedContent() {
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

  if (!booking || !reference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <CreditCard className="h-6 w-6 mx-auto mb-6 text-muted-foreground" />
          <h1 className="font-display text-3xl font-light mb-3">Réservation non trouvée</h1>
          <p className="text-muted-foreground mb-8">
            Impossible de trouver les détails de votre réservation.
          </p>
          <Link href="/" className="link-underline text-foreground">
            Retour à l&rsquo;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <CheckCircle className="h-8 w-8 mx-auto mb-6 text-primary" />
          <h1 className="font-display text-4xl font-light mb-3">Réservation confirmée</h1>
          <p className="text-muted-foreground">
            Votre réservation a été effectuée avec succès. Vous recevrez un email de confirmation.
          </p>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <div>
              <p className="eyebrow text-muted-foreground mb-1">Numéro de réservation</p>
              <p className="font-mono text-sm">{reference}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-muted-foreground mb-1">Montant total</p>
              <p className="font-display text-2xl font-light text-primary">
                {new Intl.NumberFormat('fr-FR').format(booking.total)} XOF
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="eyebrow text-muted-foreground mb-1">Dates</p>
                <p className="font-medium">
                  {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('fr-FR') : 'N/A'} – {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="eyebrow text-muted-foreground mb-1">Voyageurs</p>
                <p className="font-medium">
                  {booking.adults} adulte{booking.adults > 1 ? 's' : ''}
                  {booking.children > 0 && ` et ${booking.children} enfant${booking.children > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="eyebrow text-muted-foreground mb-1">Chambre</p>
                <p className="font-medium">ID : {booking.roomId}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="eyebrow text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{booking.guestInfo.firstName} {booking.guestInfo.lastName}</p>
                <p className="text-sm text-muted-foreground">{booking.guestInfo.email} · {booking.guestInfo.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <h2 className="eyebrow text-muted-foreground mb-4">Prochaines étapes</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>— Un email de confirmation a été envoyé à {booking.guestInfo.email}</li>
            <li>— Présentez votre numéro de réservation à l&rsquo;accueil</li>
            <li>— Le check-in est disponible à partir de 14h00</li>
            <li>— Le check-out doit être effectué avant 11h00</li>
          </ul>
        </div>

        <div className="mt-14 text-center">
          <Link href="/" className="link-underline text-foreground">
            Retour à l&rsquo;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="eyebrow text-muted-foreground">Chargement...</p>
      </div>
    }>
      <BookingConfirmedContent />
    </Suspense>
  );
}
