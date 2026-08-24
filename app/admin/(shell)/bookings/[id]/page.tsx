"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Phone, Calendar, CreditCard, Users, BedDouble } from "lucide-react";

type Booking = {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
  };
  room: {
    id: string;
    name: string;
    slug: string;
    coverImageUrl: string | null;
  };
  payment: {
    id: string;
    reference: string;
    status: string | null;
    amount: number;
    currency: string;
    method: string;
    provider: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "outline",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  SUCCESS: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

const paymentStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  SUCCESS: "default",
  FAILED: "destructive",
  REFUNDED: "outline",
};

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading, error, refetch } = useApi<{ booking: Booking }>(`/api/admin/admin-bookings/${id}`);
  const router = useRouter();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("XOF");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("SUCCESS");
  const [savingPayment, setSavingPayment] = useState(false);

  const cancelBooking = async () => {
    if (!data) return;
    if (!confirm(`Annuler la réservation ${data.booking.reference} ?`)) return;
    try {
      await api.patch(`/api/admin/admin-bookings?id=${data.booking.id}`, { status: "CANCELLED" });
      toast.success("Réservation annulée");
      router.push("/admin/bookings");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentCurrency("XOF");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setPaymentStatus("SUCCESS");
  };

  const openPaymentForm = () => {
    const payment = data?.booking.payment;
    if (payment) {
      setPaymentAmount(String(payment.amount));
      setPaymentCurrency(payment.currency || "XOF");
      setPaymentMethod(payment.method || "CASH");
      setPaymentReference(payment.reference || "");
      setPaymentStatus(payment.status || "SUCCESS");
    } else {
      resetPaymentForm();
    }
    setShowPaymentForm(true);
  };

  const savePayment = async () => {
    if (!data) return;
    if (!paymentAmount || !paymentCurrency) {
      toast.error("Le montant et la devise sont requis");
      return;
    }

    setSavingPayment(true);
    try {
      const payload = {
        amount: parseInt(paymentAmount, 10),
        currency: paymentCurrency,
        method: paymentMethod,
        reference: paymentReference || undefined,
        status: paymentStatus,
      };

      if (data.booking.payment) {
        await api.patch(`/api/admin/admin-bookings/${data.booking.id}/payment`, payload);
        toast.success("Paiement modifié avec succès");
      } else {
        await api.post(`/api/admin/admin-bookings/${data.booking.id}/payment`, payload);
        toast.success("Paiement ajouté avec succès");
      }

      setShowPaymentForm(false);
      resetPaymentForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement du paiement");
    } finally {
      setSavingPayment(false);
    }
  };

  const deletePayment = async () => {
    if (!data?.booking.payment) return;
    if (!confirm("Supprimer ce paiement ?")) return;

    try {
      await api.del(`/api/admin/admin-bookings/${data.booking.id}/payment`);
      toast.success("Paiement supprimé");
      setShowPaymentForm(false);
      resetPaymentForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la suppression du paiement");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Réservation" />
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Réservation" />
        <div className="text-center py-8 text-destructive">Erreur de chargement</div>
      </div>
    );
  }

  const booking = data.booking;

  return (
    <div>
      <PageHeader
        title={`Réservation ${booking.reference}`}
        description="Détails complets de la réservation, du client et du paiement."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/bookings">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <Button variant="destructive" onClick={cancelBooking}>
                Annuler
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations client */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Client
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Nom</div>
                <div className="font-medium">
                  {booking.guestFirstName} {booking.guestLastName}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.guestEmail || "Non renseigné"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.guestPhone || "Non renseigné"}</span>
              </div>
              {booking.user && (
                <div className="pt-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">Compte utilisateur</div>
                  <div className="font-medium">{booking.user.name || "Sans nom"}</div>
                  <div className="text-sm text-muted-foreground">{booking.user.email}</div>
                  <Badge variant="secondary" className="mt-1">
                    {booking.user.role}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Chambre
            </h3>
            <div className="space-y-2">
              <div className="font-medium">{booking.room.name}</div>
              <Link
                href={`/admin/admin-rooms/${booking.room.slug}`}
                className="text-sm text-primary hover:underline"
              >
                Voir la chambre
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4">Statut</h3>
            <Badge variant={statusColors[booking.status]} className="w-full justify-center">
              {statusLabels[booking.status] || booking.status}
            </Badge>
          </div>
        </div>

        {/* Détails réservation et paiement */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Détails du séjour
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Arrivée</div>
                <div className="font-medium">
                  {format(new Date(booking.checkIn), "dd MMM yyyy à HH:mm", { locale: fr })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Départ</div>
                <div className="font-medium">
                  {format(new Date(booking.checkOut), "dd MMM yyyy à HH:mm", { locale: fr })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Voyageurs</div>
                <div className="font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {booking.adults} adulte{booking.adults > 1 ? "s" : ""} · {booking.children} enfant{booking.children > 1 ? "s" : ""}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Créé le</div>
                <div className="font-medium">
                  {format(new Date(booking.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Paiement
            </h3>
            {booking.payment && !showPaymentForm && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Montant</div>
                    <div className="font-display text-2xl">
                      {new Intl.NumberFormat("fr-FR").format(booking.payment.amount)} {booking.payment.currency}
                    </div>
                  </div>
                  <Badge variant={booking.payment.status ? paymentStatusColors[booking.payment.status] : "secondary"}>
                    {booking.payment.status ? paymentStatusLabels[booking.payment.status] : booking.payment.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Référence</div>
                    <div className="font-medium">{booking.payment.reference}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Méthode</div>
                    <div className="font-medium">{booking.payment.method}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Date du paiement</div>
                    <div className="font-medium">
                      {format(new Date(booking.payment.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dernière mise à jour</div>
                    <div className="font-medium">
                      {format(new Date(booking.payment.updatedAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ID de transaction</div>
                    <div className="font-medium break-all">{booking.payment.id}</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button onClick={openPaymentForm} className="flex-1">Modifier le paiement</Button>
                  <Button variant="destructive" onClick={deletePayment} className="flex-1">Supprimer le paiement</Button>
                </div>
              </div>
            )}

            {!booking.payment && !showPaymentForm && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Aucun paiement enregistré</p>
                <Button onClick={openPaymentForm} className="w-full">
                  Ajouter un paiement
                </Button>
              </div>
            )}

            {showPaymentForm && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-medium">Montant</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    placeholder="Montant"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Devise</label>
                  <select
                    value={paymentCurrency}
                    onChange={(e) => setPaymentCurrency(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                  >
                    <option value="XOF">XOF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Méthode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="CARD">Carte</option>
                    <option value="BANK_TRANSFER">Virement</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Référence (optionnel)</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    placeholder="Référence du paiement"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                  >
                    <option value="SUCCESS">Payé</option>
                    <option value="PENDING">En attente</option>
                    <option value="FAILED">Échoué</option>
                    <option value="REFUNDED">Remboursé</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePayment} disabled={savingPayment} className="flex-1">
                    {savingPayment ? "Enregistrement..." : booking.payment ? "Modifier" : "Ajouter"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowPaymentForm(false); resetPaymentForm(); }} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4">Récapitulatif</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-xl">
                  {new Intl.NumberFormat("fr-FR").format(booking.total)} {booking.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
