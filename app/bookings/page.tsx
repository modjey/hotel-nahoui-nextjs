"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, MapPin, Users, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  status: string;
  reference: string | null;
  createdAt: string;
  room: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string | null;
    basePrice: number;
    currency: string;
    location: { name: string; city: string | null } | null;
  };
  payment: { id: string; reference: string; amount: number; currency: string; status: string } | null;
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchBookings = async () => {
    try {
      const data = await api.get<{ bookings: Booking[] }>("/api/bookings");
      setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (booking: Booking) => {
    if (!booking.payment) return;
    setPayingBookingId(booking.id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: booking.payment.amount,
          currency: booking.payment.currency,
          reference: booking.payment.reference,
          description: `Paiement réservation ${booking.room.name}`,
          returnUrl: `${baseUrl}/bookings/confirmed?reference=${booking.payment.reference}`,
          cancelUrl: `${baseUrl}/bookings/cancelled?reference=${booking.payment.reference}`,
          customer: {
            name: `${booking.guestFirstName} ${booking.guestLastName}`,
            email: booking.guestEmail,
            phone: booking.guestPhone,
          },
          metadata: { booking_id: booking.id, userId: user?.id },
        }),
      });
      const result = await response.json();
      if (result.success && result.data?.checkoutLink) {
        window.open(result.data.checkoutLink, "_blank");
      } else {
        console.error("Payment checkout failed:", result);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
    } finally {
      setPayingBookingId(null);
    }
  };

  const statusBadge = (label: string, icon: React.ReactNode, tone: "pending" | "success" | "error" | "neutral") => {
    const tones: Record<string, string> = {
      pending: "text-primary",
      success: "text-foreground",
      error: "text-destructive",
      neutral: "text-muted-foreground",
    };
    return (
      <span className={`eyebrow flex items-center gap-1.5 ${tones[tone]}`}>
        {icon} {label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return statusBadge("En attente", <Clock className="h-3 w-3" />, "pending");
      case "CONFIRMED": return statusBadge("Confirmée", <CheckCircle className="h-3 w-3" />, "success");
      case "CANCELLED": return statusBadge("Annulée", <XCircle className="h-3 w-3" />, "error");
      case "FAILED": return statusBadge("Échouée", <AlertCircle className="h-3 w-3" />, "error");
      default: return statusBadge(status, null, "neutral");
    }
  };

  const getPaymentStatusBadge = (payment: Booking["payment"]) => {
    if (!payment) return statusBadge("Non initié", null, "neutral");
    switch (payment.status) {
      case "PENDING": return statusBadge("En attente", <Clock className="h-3 w-3" />, "pending");
      case "SUCCESS": return statusBadge("Payé", <CheckCircle className="h-3 w-3" />, "success");
      case "FAILED": return statusBadge("Échoué", <AlertCircle className="h-3 w-3" />, "error");
      default: return statusBadge(payment.status, null, "neutral");
    }
  };

  const nights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">Votre compte</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl font-light">Mes réservations</h1>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-24">
            <Calendar className="mx-auto h-6 w-6 text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl font-light mb-2">Aucune réservation</h2>
            <p className="text-muted-foreground mb-8">Vous n&rsquo;avez pas encore de réservation.</p>
            <Link href="/stays" className="link-underline text-foreground">
              Voir les chambres & suites
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {bookings.map((booking) => (
              <div key={booking.id} className="py-10">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-56 aspect-[4/3] md:aspect-auto shrink-0 overflow-hidden">
                    <img
                      src={booking.room.coverImageUrl || "/assets/hero.png"}
                      alt={booking.room.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h3 className="font-display text-2xl font-light">{booking.room.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {booking.room.location?.city ? `${booking.room.location.city}, ` : ""}{booking.room.location?.name}
                        </p>
                      </div>
                      {booking.payment ? getPaymentStatusBadge(booking.payment) : getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                      <div>
                        <p className="eyebrow text-muted-foreground mb-1">Arrivée</p>
                        <p className="font-medium">{format(new Date(booking.checkIn), "dd MMM yyyy", { locale: fr })}</p>
                      </div>
                      <div>
                        <p className="eyebrow text-muted-foreground mb-1">Départ</p>
                        <p className="font-medium">{format(new Date(booking.checkOut), "dd MMM yyyy", { locale: fr })}</p>
                      </div>
                      <div>
                        <p className="eyebrow text-muted-foreground mb-1">Voyageurs</p>
                        <p className="font-medium flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {booking.adults + booking.children}</p>
                      </div>
                      <div>
                        <p className="eyebrow text-muted-foreground mb-1">Nuits</p>
                        <p className="font-medium">{nights(booking.checkIn, booking.checkOut)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border">
                      <div>
                        <p className="eyebrow text-muted-foreground">Référence</p>
                        <p className="font-mono text-sm mt-1">{booking.reference || booking.payment?.reference || "-"}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                        {booking.payment && booking.payment.status === "PENDING" && (
                          <button
                            onClick={() => handlePayNow(booking)}
                            disabled={payingBookingId === booking.id}
                            className="btn-fill-editorial w-full sm:w-auto disabled:opacity-60"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            {payingBookingId === booking.id ? "Traitement..." : "Payer maintenant"}
                          </button>
                        )}
                        <Link href={`/rooms/${booking.room.slug}`} className="link-underline text-foreground">
                          Voir la chambre
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
