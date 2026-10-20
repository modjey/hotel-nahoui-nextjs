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
import { ArrowLeft, User, Mail, Phone, Calendar, CreditCard, Users, BedDouble, Pencil, CheckCircle2, Trash2, CircleCheckBig } from "lucide-react";
import { BookingFormDialog, type BookingFormRoom } from "@/components/admin/BookingFormDialog";
import { getDiscountedPrice } from "@/lib/pricing";

type Booking = {
  id: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
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
    basePrice: number;
    currency: string;
    discountPercent: number;
  };
  payments: {
    id: string;
    reference: string;
    status: string | null;
    amount: number;
    currency: string;
    method: string;
    provider: string | null;
    transactionId: string | null;
    dueAt: string | null;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
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
  SUCCESS: "Encaissé",
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
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("XOF");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("SUCCESS");
  const [paymentDueAt, setPaymentDueAt] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<BookingFormRoom | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const setStatus = async (status: "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
    if (!data) return;
    setActionLoading(status);
    try {
      await api.patch(`/api/admin/admin-bookings?id=${data.booking.id}`, { status });
      toast.success(
        status === "CONFIRMED" ? "Réservation confirmée" : status === "COMPLETED" ? "Séjour terminé" : "Réservation annulée"
      );
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBooking = async () => {
    if (!data) return;
    if (!confirm(`Annuler la réservation ${data.booking.reference} ?`)) return;
    await setStatus("CANCELLED");
  };

  const deleteBooking = async () => {
    if (!data) return;
    if (!confirm(`Supprimer définitivement la réservation ${data.booking.reference} ?`)) return;
    setActionLoading("DELETE");
    try {
      await api.del(`/api/admin/bookings/${data.booking.id}`);
      toast.success("Réservation supprimée");
      router.push("/admin/bookings");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
      setActionLoading(null);
    }
  };

  const openEdit = async () => {
    if (!data) return;
    setActionLoading("EDIT");
    try {
      const res = await api.get<{ room: BookingFormRoom }>(`/api/admin/admin-rooms/${data.booking.room.slug}`);
      setEditRoom(res.room);
      setEditOpen(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setPaymentAmount("");
    setPaymentCurrency("XOF");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setPaymentStatus("SUCCESS");
    setPaymentDueAt("");
  };

  const openPaymentForm = (payment?: Booking["payments"][number]) => {
    if (payment) {
      setEditingPaymentId(payment.id);
      setPaymentAmount(String(payment.amount));
      setPaymentCurrency(payment.currency || "XOF");
      setPaymentMethod(payment.method || "CASH");
      setPaymentReference(payment.reference || "");
      setPaymentStatus(payment.status || "SUCCESS");
      setPaymentDueAt(payment.dueAt ? payment.dueAt.split("T")[0] : "");
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
        dueAt: paymentDueAt || undefined,
      };

      if (editingPaymentId) {
        await api.patch(`/api/admin/admin-bookings/${data.booking.id}/payment`, {
          ...payload,
          paymentId: editingPaymentId,
        });
        toast.success("Échéance modifiée");
      } else {
        await api.post(`/api/admin/admin-bookings/${data.booking.id}/payment`, payload);
        toast.success("Échéance ajoutée");
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

  const deletePayment = async (paymentId: string) => {
    if (!data) return;
    if (!confirm("Supprimer cette échéance ?")) return;

    try {
      await api.del(`/api/admin/admin-bookings/${data.booking.id}/payment?paymentId=${paymentId}`);
      toast.success("Échéance supprimée");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  };

  const markPaymentPaid = async (payment: Booking["payments"][number]) => {
    if (!data) return;
    try {
      await api.patch(`/api/admin/admin-bookings/${data.booking.id}/payment`, {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: "SUCCESS",
      });
      toast.success("Échéance encaissée");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
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
            <Button variant="outline" onClick={openEdit} disabled={actionLoading === "EDIT"}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            {booking.status === "PENDING" && (
              <Button onClick={() => setStatus("CONFIRMED")} disabled={actionLoading === "CONFIRMED"}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmer
              </Button>
            )}
            {booking.status === "CONFIRMED" && (
              <Button variant="secondary" onClick={() => setStatus("COMPLETED")} disabled={actionLoading === "COMPLETED"}>
                <CircleCheckBig className="h-4 w-4 mr-2" />
                Terminée
              </Button>
            )}
            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <Button variant="destructive" onClick={cancelBooking} disabled={actionLoading === "CANCELLED"}>
                Annuler
              </Button>
            )}
            <Button variant="outline" onClick={deleteBooking} disabled={actionLoading === "DELETE"}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {editRoom && (
        <BookingFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          rooms={[editRoom]}
          fixedRoomId={booking.room.id}
          editingBooking={{
            id: booking.id,
            roomId: booking.room.id,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            adults: booking.adults,
            children: booking.children,
            status: booking.status,
            userId: booking.user?.id ?? null,
            guestFirstName: booking.guestFirstName,
            guestLastName: booking.guestLastName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
          }}
          onSaved={refetch}
        />
      )}

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Échéancier de paiement
              </h3>
              {!showPaymentForm && (
                <Button size="sm" onClick={() => openPaymentForm()}>
                  Ajouter une échéance
                </Button>
              )}
            </div>

            {booking.payments.length === 0 && !showPaymentForm && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Aucune échéance enregistrée</p>
                <Button onClick={() => openPaymentForm()} className="w-full">
                  Ajouter un acompte
                </Button>
              </div>
            )}

            {booking.payments.length > 0 && (
              <div className="space-y-3">
                {booking.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-lg">
                          {new Intl.NumberFormat("fr-FR").format(p.amount)} {p.currency}
                        </span>
                        <Badge variant={p.status ? paymentStatusColors[p.status] : "secondary"}>
                          {p.status ? paymentStatusLabels[p.status] || p.status : "-"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                        <div>Réf {p.reference} · {p.method}</div>
                        {p.dueAt && (
                          <div>Échéance : {format(new Date(p.dueAt), "dd MMM yyyy", { locale: fr })}</div>
                        )}
                        {p.paidAt && (
                          <div>Encaissé le {format(new Date(p.paidAt), "dd MMM yyyy à HH:mm", { locale: fr })}</div>
                        )}
                        {p.transactionId && (
                          <div className="break-all">Transaction : {p.transactionId}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {p.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Marquer comme encaissé"
                          onClick={() => markPaymentPaid(p)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Modifier"
                        onClick={() => openPaymentForm(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deletePayment(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showPaymentForm && (
              <div className="space-y-4 pt-4 mt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Montant *</label>
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
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                      <option value="ON_SITE">Sur place</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date d&apos;échéance</label>
                    <input
                      type="date"
                      value={paymentDueAt}
                      onChange={(e) => setPaymentDueAt(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Statut</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    >
                      <option value="SUCCESS">Encaissé</option>
                      <option value="PENDING">En attente</option>
                      <option value="FAILED">Échoué</option>
                      <option value="REFUNDED">Remboursé</option>
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
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePayment} disabled={savingPayment} className="flex-1">
                    {savingPayment ? "Enregistrement..." : editingPaymentId ? "Modifier" : "Ajouter"}
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
            {(() => {
              const nights = Math.max(
                1,
                Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
              );
              const nightlyRate = getDiscountedPrice(booking.room.basePrice, booking.room.discountPercent);
              const stayTotal = nightlyRate * nights;
              const currency = booking.payments[0]?.currency || booking.room.currency;
              const paid = booking.payments
                .filter((p) => p.status === "SUCCESS")
                .reduce((s, p) => s + p.amount, 0);
              const pending = booking.payments
                .filter((p) => p.status === "PENDING")
                .reduce((s, p) => s + p.amount, 0);
              const remaining = Math.max(0, stayTotal - paid);
              const fmtAmount = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} ${currency}`;
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total séjour ({nights} nuit{nights > 1 ? "s" : ""})
                      {booking.room.discountPercent > 0 && (
                        <span className="ml-1.5 text-green-600">(promo -{booking.room.discountPercent}%)</span>
                      )}
                    </span>
                    <span className="font-medium">{fmtAmount(stayTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Encaissé</span>
                    <span className="font-medium text-green-600">{fmtAmount(paid)}</span>
                  </div>
                  {pending > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Échéances en attente</span>
                      <span className="font-medium">{fmtAmount(pending)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Reste à payer</span>
                    <span className="font-display text-xl">{fmtAmount(remaining)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
