"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookingFormDialog } from "@/components/admin/BookingFormDialog";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Users, Pencil, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Eye } from "lucide-react";

type Room = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  currency: string;
  maxGuests: number;
  beds: number;
  bathrooms: number;
  location: { id: string; name: string; city: string | null };
  roomType: { id: string; name: string };
};

type Booking = {
  id: string;
  reference: string | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  status: string;
  payment: { status: string | null } | null;
  userId: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
};

export default function AdminRoomBookingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { data: roomData, loading: roomLoading } = useApi<{ room: Room }>(`/api/admin/admin-rooms/${slug}`);
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useApi<{ bookings: Booking[] }>(`/api/admin/bookings?roomSlug=${slug}`);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Palette de couleurs pour différencier les réservations
  const bookingColors = [
    { bg: "bg-red-500", border: "border-red-600", text: "text-white" },
    { bg: "bg-blue-500", border: "border-blue-600", text: "text-white" },
    { bg: "bg-green-500", border: "border-green-600", text: "text-white" },
    { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
    { bg: "bg-orange-500", border: "border-orange-600", text: "text-white" },
    { bg: "bg-pink-500", border: "border-pink-600", text: "text-white" },
    { bg: "bg-teal-500", border: "border-teal-600", text: "text-white" },
    { bg: "bg-indigo-500", border: "border-indigo-600", text: "text-white" },
  ];

  // Fonction pour obtenir la couleur d'une réservation
  const getBookingColor = (bookingId: string) => {
    const index = bookings.findIndex(b => b.id === bookingId);
    return bookingColors[index % bookingColors.length];
  };
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);

  const room = roomData?.room;
  const bookings = bookingsData?.bookings || [];

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    try {
      await api.del(`/api/admin/bookings/${id}`);
      toast.success("Supprimée");
      refetchBookings();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingBooking(null);
    setDialogOpen(true);
  };

  if (roomLoading || bookingsLoading) {
    return (
      <div>
        <PageHeader title="Réservations" />
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div>
        <PageHeader title="Réservations" />
        <div className="text-center py-8 text-destructive">Chambre introuvable</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Réservations - ${room.name}`}
        description="Gérez les réservations de cette chambre."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/admin-rooms">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle réservation
            </Button>
          </div>
        }
      />

      <BookingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rooms={[{ ...room, bookings }]}
        fixedRoomId={room.id}
        editingBooking={editingBooking}
        onSaved={refetchBookings}
      />

      {/* Calendrier des réservations */}
      <div className="rounded-2xl bg-card border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Calendrier des réservations</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth),
          }).map((date) => {
            const dayBookings = bookings.filter((b) => {
              // Exclure les réservations annulées
              if (b.status === "CANCELLED") return false;
              const checkIn = new Date(b.checkIn);
              const checkOut = new Date(b.checkOut);
              return isWithinInterval(date, { start: checkIn, end: new Date(checkOut.getTime() - 1) }) ||
                     isSameDay(date, checkIn) ||
                     isSameDay(date, new Date(checkOut.getTime() - 1));
            });
            const isBooked = dayBookings.length > 0;
            const isToday = isSameDay(date, new Date());

            // Utiliser la couleur de la première réservation du jour
            const color = isBooked && dayBookings.length > 0 ? getBookingColor(dayBookings[0].id) : null;

            return (
              <div
                key={date.toISOString()}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative p-1
                  ${isBooked && color ? `${color.bg} ${color.text} border-2 ${color.border}` : isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                  hover:opacity-80 transition-opacity cursor-pointer
                `}
                title={dayBookings.length > 0 ? dayBookings.map(b => `${b.guestFirstName} ${b.guestLastName} (${format(new Date(b.checkIn), 'dd/MM')} - ${format(new Date(b.checkOut), 'dd/MM')})`).join(', ') : ''}
                onClick={() => {
                  if (dayBookings.length > 0) {
                    setSelectedBooking(dayBookings[0]);
                    setBookingDetailOpen(true);
                  }
                }}
              >
                {isBooked && dayBookings.length > 0 && (
                  <>
                    <span className="truncate max-w-full text-center leading-tight font-semibold">
                      {dayBookings[0].user?.name || dayBookings[0].guestFirstName}
                    </span>
                    <span className="truncate max-w-full text-center leading-tight font-semibold">
                      {dayBookings[0].guestLastName}
                    </span>
                    <span className="truncate max-w-full text-center leading-tight opacity-80">
                      {dayBookings[0].reference}
                    </span>
                  </>
                )}
                <span className="font-bold text-sm">{format(date, "d")}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {bookingColors.slice(0, 4).map((color, i) => (
                <div key={i} className={`w-3 h-3 rounded ${color.bg} ${color.border} border`} />
              ))}
            </div>
            <span className="text-muted-foreground">Réservations (couleurs différentes)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-muted-foreground">Aujourd&apos;hui</span>
          </div>
        </div>
      </div>

      {/* Dialogue de détails de réservation */}
      <Dialog open={bookingDetailOpen} onOpenChange={setBookingDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <div className="font-medium">
                  {selectedBooking.userId ? (
                    <Link href={`/admin/users/${selectedBooking.userId}`} className="hover:underline">
                      {selectedBooking.user?.name || selectedBooking.guestFirstName} {selectedBooking.guestLastName}
                    </Link>
                  ) : (
                    <span>{selectedBooking.user?.name || selectedBooking.guestFirstName} {selectedBooking.guestLastName}</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{selectedBooking.user?.email || selectedBooking.guestEmail}</div>
                <div className="text-sm text-muted-foreground">{selectedBooking.user?.phone || selectedBooking.guestPhone}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Dates</Label>
                <div className="font-medium">
                  {format(new Date(selectedBooking.checkIn), "dd MMM yyyy", { locale: fr })} → {format(new Date(selectedBooking.checkOut), "dd MMM yyyy", { locale: fr })}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Occupants</Label>
                <div className="font-medium">
                  {selectedBooking.adults} adulte{selectedBooking.adults > 1 ? "s" : ""} · {selectedBooking.children} enfant{selectedBooking.children > 1 ? "s" : ""}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <Badge className={
                  selectedBooking.status === "CONFIRMED" 
                    ? "bg-green-600 text-white border-green-600" 
                    : selectedBooking.status === "PENDING" 
                    ? "bg-yellow-600 text-white border-yellow-600" 
                    : "bg-red-600 text-white border-red-600"
                }>
                  {selectedBooking.status === "CONFIRMED" ? "Confirmé" : selectedBooking.status === "PENDING" ? "En attente" : "Annulé"}
                </Badge>
              </div>
              {selectedBooking.reference && (
                <div>
                  <Label className="text-muted-foreground">Référence</Label>
                  <div className="font-medium">{selectedBooking.reference}</div>
                </div>
              )}
              {selectedBooking.payment?.status === "SUCCESS" && (
                <div>
                  <Label className="text-muted-foreground">Paiement</Label>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Payé
                  </Badge>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setBookingDetailOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => {
                  setBookingDetailOpen(false);
                  handleEdit(selectedBooking);
                }}>
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl bg-card border border-border">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune réservation</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map((b) => (
              <div key={b.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="font-medium">
                      {b.userId ? (
                        <Link href={`/admin/users/${b.userId}`} className="hover:underline">
                          {b.user?.name || b.guestFirstName} {b.guestLastName}
                        </Link>
                      ) : (
                        <span>{b.user?.name || b.guestFirstName} {b.guestLastName}</span>
                      )}
                    </div>
                    <Badge className={
                      b.status === "CONFIRMED" 
                        ? "bg-green-600 text-white border-green-600" 
                        : b.status === "PENDING" 
                        ? "bg-yellow-600 text-white border-yellow-600" 
                        : "bg-red-600 text-white border-red-600"
                    }>
                      {b.status === "CONFIRMED" ? "Confirmé" : b.status === "PENDING" ? "En attente" : "Annulé"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(b.checkIn), "dd MMM yyyy", { locale: fr })} → {format(new Date(b.checkOut), "dd MMM yyyy", { locale: fr })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {b.adults} adulte{b.adults > 1 ? "s" : ""} · {b.children} enfant{b.children > 1 ? "s" : ""}
                    </div>
                    {b.reference && (
                      <div className="flex items-center gap-1">
                        <span>Réf: {b.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/admin/bookings/${b.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
