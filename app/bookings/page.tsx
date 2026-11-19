"use client";
import { displayRoomName } from "@/lib/room-display";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { AuthModal } from "@/components/auth/AuthModal";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/auth/AuthProvider";
import { HOTEL_CONTACT, whatsappLink } from "@/lib/hotel-contact";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: string;
  reference: string | null;
  expiresAt: string | null;
  createdAt: string;
  room: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string | null;
    currency: string;
    location: { name: string; city: string | null } | null;
  };
  payments: { id: string; reference: string; amount: number; currency: string; status: string }[];
};

type Tone = "pending" | "success" | "error" | "neutral";

const TONES: Record<Tone, string> = {
  pending: "text-primary",
  success: "text-foreground",
  error: "text-destructive",
  neutral: "text-muted-foreground",
};

function StatusBadge({ label, icon, tone }: { label: string; icon?: React.ReactNode; tone: Tone }) {
  return (
    <span className={`eyebrow flex items-center gap-1.5 ${TONES[tone]}`}>
      {icon} {label}
    </span>
  );
}

/** Statut affiché au client. Le règlement se fait hors plateforme : on parle de confirmation par l'hôtel. */
function bookingStatus(booking: Booking): { label: string; icon: React.ReactNode; tone: Tone } {
  const paid = booking.payments.filter((p) => p.status === "SUCCESS").length;
  switch (booking.status) {
    case "PENDING":
      return paid > 0
        ? { label: "Acompte reçu · en attente de confirmation", icon: <Clock className="h-3 w-3" />, tone: "pending" }
        : { label: "En attente de confirmation", icon: <Clock className="h-3 w-3" />, tone: "pending" };
    case "CONFIRMED":
      return { label: "Confirmée", icon: <CheckCircle className="h-3 w-3" />, tone: "success" };
    case "COMPLETED":
      return { label: "Séjour terminé", icon: <CheckCircle className="h-3 w-3" />, tone: "neutral" };
    case "CANCELLED":
      return { label: "Annulée", icon: <XCircle className="h-3 w-3" />, tone: "error" };
    default:
      return { label: booking.status, icon: <AlertCircle className="h-3 w-3" />, tone: "neutral" };
  }
}

function nightsBetween(checkIn: string, checkOut: string) {
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000));
}

function fcfa(value: number, currency = "XOF") {
  const amount = new Intl.NumberFormat("fr-FR").format(Math.round(value));
  return currency === "XOF" ? `${amount} FCFA` : `${amount} ${currency}`;
}

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await api.get<{ bookings: Booking[] }>("/api/bookings");
      setBookings(data.bookings);
    } catch (error) {
      console.error("Erreur de chargement des réservations", error);
      toast.error("Impossible de charger vos réservations. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    // Chargement initial puis rafraîchissement quand l'onglet reprend le focus
    // (l'hôtel a pu confirmer la réservation entre-temps).
    const initial = window.setTimeout(fetchBookings, 0);
    window.addEventListener("focus", fetchBookings);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("focus", fetchBookings);
    };
  }, [authLoading, user, fetchBookings]);

  const confirmCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await api.patch(`/api/bookings/${toCancel.id}`, { action: "cancel" });
      toast.success("Votre demande a été annulée.");
      setToCancel(null);
      await fetchBookings();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Annulation impossible. Contactez l'hôtel.");
    } finally {
      setCancelling(false);
    }
  };

  const showSkeleton = authLoading || (user && loading);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">Votre compte</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl font-light">Mes réservations</h1>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 lg:px-10 py-16">
        {showSkeleton ? (
          <div className="space-y-6" aria-busy="true" aria-label="Chargement des réservations">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : !user ? (
          <div className="text-center py-24">
            <h2 className="font-display text-2xl font-light mb-2">Connectez-vous pour voir vos réservations</h2>
            <p className="text-muted-foreground mb-8">Vos demandes et séjours confirmés apparaissent ici.</p>
            <button type="button" onClick={() => setAuthOpen(true)} className="btn-fill-editorial">
              Se connecter
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-24">
            <Calendar className="mx-auto h-6 w-6 text-muted-foreground mb-4" aria-hidden="true" />
            <h2 className="font-display text-2xl font-light mb-2">Aucune réservation</h2>
            <p className="text-muted-foreground mb-8">Vous n&rsquo;avez pas encore de réservation.</p>
            <Link href="/stays" className="link-underline text-foreground">
              Voir les chambres & suites
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {bookings.map((booking) => {
              const status = bookingStatus(booking);
              const total = booking.payments.reduce((sum, p) => sum + p.amount, 0);
              const paid = booking.payments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amount, 0);
              const isPending = booking.status === "PENDING";
              const canCancel = isPending && paid === 0;
              const ref = booking.reference || booking.payments[0]?.reference || "";
              return (
                <article key={booking.id} className="py-10">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-56 aspect-[4/3] md:aspect-auto shrink-0 overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={booking.room.coverImageUrl || "/assets/hero.png"}
                        alt={displayRoomName(booking.room.name)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <h2 className="font-display text-2xl font-light">{displayRoomName(booking.room.name)}</h2>
                          {booking.room.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                              {booking.room.location.city ? `${booking.room.location.city}, ` : ""}
                              {booking.room.location.name}
                            </p>
                          )}
                        </div>
                        <StatusBadge {...status} />
                      </div>

                      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-sm">
                        <div>
                          <dt className="eyebrow text-muted-foreground mb-1">Arrivée</dt>
                          <dd className="font-medium">{format(new Date(booking.checkIn), "dd MMM yyyy", { locale: fr })}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow text-muted-foreground mb-1">Départ</dt>
                          <dd className="font-medium">{format(new Date(booking.checkOut), "dd MMM yyyy", { locale: fr })}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow text-muted-foreground mb-1">Voyageurs</dt>
                          <dd className="font-medium flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden="true" /> {booking.adults + booking.children}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow text-muted-foreground mb-1">Nuits</dt>
                          <dd className="font-medium">{nightsBetween(booking.checkIn, booking.checkOut)}</dd>
                        </div>
                        {total > 0 && (
                          <div>
                            <dt className="eyebrow text-muted-foreground mb-1">Montant</dt>
                            <dd className="font-medium tabular">{fcfa(total, booking.room.currency)}</dd>
                          </div>
                        )}
                      </dl>

                      {isPending && (
                        <div className="bg-secondary/60 p-5 text-sm leading-relaxed">
                          <p className="font-medium text-foreground">Votre demande est bien reçue.</p>
                          <p className="text-muted-foreground mt-1">
                            Le règlement ne se fait pas en ligne : notre équipe vous contacte pour convenir du paiement,
                            puis confirme votre séjour par email.
                            {booking.expiresAt && (
                              <> La chambre vous est réservée jusqu&apos;au{" "}
                                <strong className="text-foreground">{format(new Date(booking.expiresAt), "d MMMM 'à' HH'h'mm", { locale: fr })}</strong>.
                              </>
                            )}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                            <a
                              href={whatsappLink(`Bonjour, je souhaite régler ma réservation ${ref} (${booking.room.name}).`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-underline text-foreground"
                            >
                              Régler via WhatsApp
                            </a>
                            <a href={`tel:${HOTEL_CONTACT.phones[0].replace(/\s/g, "")}`} className="link-underline text-foreground inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {HOTEL_CONTACT.phones[0]}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border">
                        <div>
                          <p className="eyebrow text-muted-foreground">Référence</p>
                          <p className="font-mono text-sm mt-1">{ref || "-"}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setToCancel(booking)}
                              className="text-sm text-destructive hover:underline underline-offset-4 min-h-11"
                            >
                              Annuler la demande
                            </button>
                          )}
                          {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && ref && (
                            <Link
                              href={`/contact?sujet=reclamation&ref=${encodeURIComponent(ref)}`}
                              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline min-h-11 inline-flex items-center"
                            >
                              Signaler un problème
                            </Link>
                          )}
                          <Link href={`/rooms/${booking.room.slug}`} className="link-underline text-foreground">
                            Voir la chambre
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={!!toCancel} onOpenChange={(open) => !open && !cancelling && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel?.room.name} du {toCancel ? format(new Date(toCancel.checkIn), "d MMM", { locale: fr }) : ""} au{" "}
              {toCancel ? format(new Date(toCancel.checkOut), "d MMM yyyy", { locale: fr }) : ""}. La chambre sera libérée
              pour d&apos;autres clients. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Garder ma demande</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmCancel();
              }}
              disabled={cancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelling ? "Annulation…" : "Oui, annuler"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} purpose="booking" />
      <Footer />
    </div>
  );
}
