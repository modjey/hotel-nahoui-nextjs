'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, CreditCard, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

type PaymentStatusData = {
  reference?: string;
  amount?: number;
  currency?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  bookingStatus?: string;
};

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const attemptsRef = useRef(0);

  const load = useCallback(async () => {
    if (!reference) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Polling court tant que le paiement est encore en attente.
        if (json.data?.status === 'PENDING' && attemptsRef.current < 5) {
          attemptsRef.current += 1;
          setTimeout(load, 3000);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reference) {
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

  const status = data?.status ?? 'PENDING';
  const isSuccess = status === 'SUCCESS';
  const isPending = status === 'PENDING';
  const isFailed = status === 'FAILED' || status === 'REFUNDED';

  const heading = isSuccess
    ? 'Réservation confirmée'
    : isPending
      ? 'Paiement en cours de vérification'
      : 'Paiement non abouti';

  const message = isSuccess
    ? 'Votre réservation est confirmée. Vous recevrez un email de confirmation.'
    : isPending
      ? 'Nous vérifions encore votre paiement. Cette page se mettra à jour automatiquement.'
      : 'Le paiement n’a pas abouti. Votre réservation reste en attente et pourra être payée à nouveau.';

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          {isPending ? (
            <Clock className="h-8 w-8 mx-auto mb-6 text-muted-foreground" />
          ) : isFailed ? (
            <CreditCard className="h-8 w-8 mx-auto mb-6 text-destructive" />
          ) : (
            <CheckCircle className="h-8 w-8 mx-auto mb-6 text-primary" />
          )}
          <h1 className="font-display text-4xl font-light mb-3">{heading}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <div>
              <p className="eyebrow text-muted-foreground mb-1">Numéro de réservation</p>
              <p className="font-mono text-sm">{reference}</p>
            </div>
            {typeof data?.amount === 'number' && (
              <div className="text-right">
                <p className="eyebrow text-muted-foreground mb-1">Montant</p>
                <p className="font-display text-2xl font-light text-primary">
                  {new Intl.NumberFormat('fr-FR').format(data.amount)} {data.currency ?? 'XOF'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="eyebrow text-muted-foreground mb-1">Statut</p>
              <p className="font-medium">
                {isSuccess
                  ? 'Paiement reçu — réservation confirmée'
                  : isPending
                    ? 'En attente de confirmation du paiement'
                    : 'Paiement non abouti'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/bookings" className="link-underline text-foreground">
            Voir mes réservations
          </Link>
          <Link href="/" className="link-underline text-muted-foreground">
            Retour à l&rsquo;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BookingConfirmedContent />
    </Suspense>
  );
}
