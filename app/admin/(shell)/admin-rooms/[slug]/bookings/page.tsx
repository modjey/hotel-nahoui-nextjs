"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Users, Pencil, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { normalizeIvoryCoastPhone } from "@/lib/auth/schemas";

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

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
};

export default function AdminRoomBookingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const { data: roomData, loading: roomLoading, refetch: refetchRoom } = useApi<{ room: Room }>(`/api/admin/admin-rooms/${slug}`);
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useApi<{ bookings: Booking[] }>(`/api/admin/bookings?roomSlug=${slug}`);
  const { data: usersData } = useApi<{ users: User[] }>("/api/admin/users");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    newName: "",
    newEmail: "",
    newPhone: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    status: "CONFIRMED",
    paymentAmount: "",
    paymentCurrency: "XOF",
    paymentStatus: "SUCCESS",
    paymentMethod: "CASH",
    transactionId: "",
  });

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
  const [creatingUser, setCreatingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const room = roomData?.room;
  const bookings = bookingsData?.bookings || [];
  const users = usersData?.users || [];
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    // Vérifier qu'un utilisateur est sélectionné ou créé
    if (!creatingUser && !formData.userId) {
      toast.error("Veuillez sélectionner un utilisateur ou en créer un nouveau");
      return;
    }

    setSubmitting(true);
    try {
      let userId = formData.userId;

      // Créer l'utilisateur si nécessaire
      if (creatingUser) {
        // Vérifier si l'email existe déjà
        const existingUserByEmail = users.find(u => u.email === formData.newEmail);
        if (existingUserByEmail) {
          toast.error("Un utilisateur avec cet email existe déjà. Veuillez le sélectionner dans la liste.");
          setSubmitting(false);
          return;
        }

        // Vérifier si le numéro de téléphone existe déjà (si fourni)
        if (formData.newPhone) {
          const normalizedPhone = normalizeIvoryCoastPhone(formData.newPhone);
          if (normalizedPhone) {
            const existingUserByPhone = users.find(u => u.phone === normalizedPhone);
            if (existingUserByPhone) {
              toast.error("Un utilisateur avec ce numéro de téléphone existe déjà. Veuillez le sélectionner dans la liste.");
              setSubmitting(false);
              return;
            }
          }
        }

        const userResponse = await api.post("/api/admin/users", {
          name: formData.newName,
          email: formData.newEmail,
          phone: formData.newPhone ? normalizeIvoryCoastPhone(formData.newPhone) : null,
        });
        userId = (userResponse as any).user.id;
      }

      const payload = {
        roomId: room.id,
        userId: userId,
        guestFirstName: creatingUser ? formData.newName.split(' ')[0] : undefined,
        guestLastName: creatingUser ? formData.newName.split(' ').slice(1).join(' ') : undefined,
        guestEmail: creatingUser ? formData.newEmail : undefined,
        guestPhone: creatingUser ? formData.newPhone : undefined,
        checkIn: new Date(formData.checkIn).toISOString(),
        checkOut: new Date(formData.checkOut).toISOString(),
        adults: formData.adults,
        children: formData.children,
        status: formData.status,
      };

      if (editingBooking) {
        await api.patch(`/api/admin/bookings/${editingBooking.id}`, payload);
        toast.success("Réservation modifiée");
      } else {
        const bookingResponse = await api.post("/api/admin/bookings", payload);
        toast.success("Réservation créée");

        // Créer le paiement si un montant est spécifié
        if (formData.paymentAmount) {
          const paymentPayload: any = {
            bookingId: (bookingResponse as any).booking.id,
            amount: parseFloat(formData.paymentAmount),
            currency: formData.paymentCurrency,
            status: formData.paymentStatus,
            method: formData.paymentMethod,
            reference: `PAY-${Date.now()}`,
          };
          if (formData.transactionId) {
            paymentPayload.transactionId = formData.transactionId;
          }
          await api.post("/api/admin/payments", paymentPayload);
          toast.success("Paiement créé");
        }
      }

      setDialogOpen(false);
      setEditingBooking(null);
      setFormData({
        userId: "",
        newName: "",
        newEmail: "",
        newPhone: "",
        checkIn: "",
        checkOut: "",
        adults: 1,
        children: 0,
        status: "CONFIRMED",
        paymentAmount: "",
        paymentCurrency: "XOF",
        paymentStatus: "SUCCESS",
        paymentMethod: "CASH",
        transactionId: "",
      });
      setCreatingUser(false);
      refetchBookings();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

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
    setFormData({
      userId: booking.userId || "",
      newName: booking.guestFirstName && booking.guestLastName ? `${booking.guestFirstName} ${booking.guestLastName}` : booking.guestFirstName || "",
      newEmail: booking.guestEmail || "",
      newPhone: booking.guestPhone || "",
      checkIn: booking.checkIn.split("T")[0],
      checkOut: booking.checkOut.split("T")[0],
      adults: booking.adults,
      children: booking.children,
      status: booking.status,
      paymentAmount: "",
      paymentCurrency: "XOF",
      paymentStatus: "SUCCESS",
      paymentMethod: "CASH",
      transactionId: "",
    });
    setCreatingUser(!booking.userId);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingBooking(null);
    setFormData({
      userId: "",
      newName: "",
      newEmail: "",
      newPhone: "",
      checkIn: "",
      checkOut: "",
      adults: 1,
      children: 0,
      status: "CONFIRMED",
      paymentAmount: "",
      paymentCurrency: "XOF",
      paymentStatus: "SUCCESS",
      paymentMethod: "CASH",
      transactionId: "",
    });
    setCreatingUser(false);
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle réservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBooking ? "Modifier" : "Créer"} une réservation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <Tabs value={creatingUser ? "new" : "existing"} onValueChange={(value) => {
                      setCreatingUser(value === "new");
                      if (value === "new") {
                        setFormData({ ...formData, userId: "" });
                      }
                    }}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="existing">Utilisateur existant</TabsTrigger>
                        <TabsTrigger value="new">Nouvel utilisateur</TabsTrigger>
                      </TabsList>
                      <TabsContent value="existing" className="space-y-3">
                        <Input
                          placeholder="Rechercher un utilisateur..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full"
                        />
                        <div className="max-h-48 overflow-y-auto border border-input rounded-md">
                          {filteredUsers.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              Aucun utilisateur trouvé
                            </div>
                          ) : (
                            filteredUsers.map((u) => (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setFormData({ ...formData, userId: u.id });
                                }}
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors ${
                                  formData.userId === u.id ? "bg-muted" : ""
                                }`}
                              >
                                {u.image ? (
                                  <img
                                    src={u.image}
                                    alt={u.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                      {u.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{u.name}</div>
                                  <div className="text-xs text-muted-foreground">{u.email}</div>
                                  {u.phone && (
                                    <div className="text-xs text-muted-foreground">{u.phone}</div>
                                  )}
                                </div>
                                {formData.userId === u.id && (
                                  <div className="w-4 h-4 rounded-full bg-primary" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="new" className="space-y-3">
                        <div>
                          <Label>Nom complet *</Label>
                          <Input
                            value={formData.newName}
                            onChange={(e) => setFormData({ ...formData, newName: e.target.value })}
                            placeholder="ex: Jean Dupont"
                            required
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={formData.newEmail}
                            onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                            placeholder="ex: jean@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label>Téléphone</Label>
                          <Input
                            value={formData.newPhone}
                            onChange={(e) => setFormData({ ...formData, newPhone: e.target.value })}
                            placeholder="ex: 07 00 00 00 00"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div>
                      <Label>Dates du séjour *</Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-accent hover:text-accent-foreground"
                          >
                            {formData.checkIn && formData.checkOut
                              ? `${format(new Date(formData.checkIn), "dd MMM yyyy", { locale: fr })} → ${format(new Date(formData.checkOut), "dd MMM yyyy", { locale: fr })}`
                              : formData.checkIn
                                ? `Arrivée ${format(new Date(formData.checkIn), "dd MMM yyyy", { locale: fr })} · choisissez un départ`
                                : "Sélectionner arrivée et départ"}
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="space-y-3">
                            <CalendarPicker
                              mode="range"
                              selected={formData.checkIn && formData.checkOut ? { from: new Date(formData.checkIn), to: new Date(formData.checkOut) } : undefined}
                              onSelect={(range) => {
                                setFormData({
                                  ...formData,
                                  checkIn: range?.from?.toISOString().split('T')[0] || '',
                                  checkOut: range?.to?.toISOString().split('T')[0] || '',
                                });
                              }}
                              disabled={(date) => {
                                // Désactiver les dates passées
                                if (date < new Date()) return true;

                                // Désactiver les dates déjà réservées
                                const isBooked = bookings.some((b) => {
                                  const checkIn = new Date(b.checkIn);
                                  const checkOut = new Date(b.checkOut);
                                  return isWithinInterval(date, { start: checkIn, end: new Date(checkOut.getTime() - 1) }) ||
                                         isSameDay(date, checkIn) ||
                                         isSameDay(date, new Date(checkOut.getTime() - 1));
                                });
                                return isBooked;
                              }}
                              numberOfMonths={2}
                            />
                            <div className="flex justify-end p-3 border-t border-border">
                              <button
                                type="button"
                                onClick={() => setDatePickerOpen(false)}
                                className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                              >
                                Confirmer
                              </button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Voyageurs *</Label>
                      <Popover open={guestPickerOpen} onOpenChange={setGuestPickerOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-accent hover:text-accent-foreground"
                          >
                            {formData.adults} adulte{formData.adults > 1 ? "s" : ""} · {formData.children} enfant{formData.children > 1 ? "s" : ""} (max {room.maxGuests})
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="start">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Adultes</div>
                                <div className="text-xs text-muted-foreground">13 ans et plus</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}
                                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center">{formData.adults}</span>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, adults: Math.min(room.maxGuests - formData.children, formData.adults + 1) })}
                                  disabled={formData.adults + formData.children >= room.maxGuests}
                                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Enfants</div>
                                <div className="text-xs text-muted-foreground">2–12 ans</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center">{formData.children}</span>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, children: Math.min(room.maxGuests - formData.adults, formData.children + 1) })}
                                  disabled={formData.adults + formData.children >= room.maxGuests}
                                  className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setGuestPickerOpen(false)}
                              className="w-full h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              Confirmer
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Statut</Label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="CONFIRMED">Confirmé</option>
                        <option value="PENDING">En attente</option>
                        <option value="CANCELLED">Annulé</option>
                      </select>
                    </div>

                    <div className="border-t border-border pt-4">
                      <h4 className="font-medium mb-3">Paiement</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Montant *</Label>
                          <Input
                            type="number"
                            value={formData.paymentAmount}
                            onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Devise</Label>
                          <select
                            value={formData.paymentCurrency}
                            onChange={(e) => setFormData({ ...formData, paymentCurrency: e.target.value })}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="XOF">XOF</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label>Statut du paiement</Label>
                          <select
                            value={formData.paymentStatus}
                            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="SUCCESS">Payé</option>
                            <option value="PENDING">En attente</option>
                            <option value="FAILED">Échoué</option>
                          </select>
                        </div>
                        <div>
                          <Label>Méthode de paiement</Label>
                          <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="CASH">Espèces</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="CARD">Carte bancaire</option>
                            <option value="BANK_TRANSFER">Virement</option>
                            <option value="ON_SITE">Paiement sur place</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Transaction ID (optionnel)</Label>
                        <Input
                          type="text"
                          value={formData.transactionId}
                          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                          placeholder="ID de transaction externe"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Traitement..." : editingBooking ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
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
            <span className="text-muted-foreground">Aujourd'hui</span>
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
