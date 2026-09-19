"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HotelBookingCalendar, { buildAvailabilityMap } from "@/components/site/HotelBookingCalendar";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { normalizeIvoryCoastPhone } from "@/lib/auth/schemas";

export type BookingFormRoom = {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  maxGuests: number;
  bookings?: { id: string; checkIn: string; checkOut: string; status: string }[];
};

export type BookingFormEditing = {
  id: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: string;
  userId: string | null;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: BookingFormRoom[];
  fixedRoomId?: string;
  editingBooking?: BookingFormEditing | null;
  onSaved: () => void;
};

const emptyForm = {
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
};

const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function BookingFormDialog({ open, onOpenChange, rooms, fixedRoomId, editingBooking, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBooking ? "Modifier" : "Créer"} une réservation</DialogTitle>
        </DialogHeader>
        {/* Le contenu du Dialog n'est monté qu'à l'ouverture : le formulaire
            repart donc d'un état neuf à chaque fois. */}
        <BookingForm
          key={editingBooking?.id ?? "new"}
          rooms={rooms}
          fixedRoomId={fixedRoomId}
          editingBooking={editingBooking}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function BookingForm({
  rooms,
  fixedRoomId,
  editingBooking,
  onClose,
  onSaved,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { data: usersData } = useApi<{ users: User[] }>("/api/admin/users");
  const users = usersData?.users || [];

  const [formData, setFormData] = useState(() => {
    if (!editingBooking) return emptyForm;
    return {
      ...emptyForm,
      userId: editingBooking.userId || "",
      newName:
        editingBooking.guestFirstName && editingBooking.guestLastName
          ? `${editingBooking.guestFirstName} ${editingBooking.guestLastName}`
          : editingBooking.guestFirstName || "",
      newEmail: editingBooking.guestEmail || "",
      newPhone: editingBooking.guestPhone || "",
      checkIn: editingBooking.checkIn.split("T")[0],
      checkOut: editingBooking.checkOut.split("T")[0],
      adults: editingBooking.adults,
      children: editingBooking.children,
      status: editingBooking.status,
    };
  });
  const [creatingUser, setCreatingUser] = useState(editingBooking ? !editingBooking.userId : false);
  const [submitting, setSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roomId, setRoomId] = useState(editingBooking?.roomId || fixedRoomId || "");

  const room = rooms.find((r) => r.id === roomId);
  const formAvailabilityMap = buildAvailabilityMap(
    room?.bookings || [],
    editingBooking ? [editingBooking.id] : []
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    if (!creatingUser && !formData.userId) {
      toast.error("Veuillez sélectionner un utilisateur ou en créer un nouveau");
      return;
    }
    if (!formData.checkIn || !formData.checkOut) {
      toast.error("Veuillez sélectionner les dates du séjour");
      return;
    }

    setSubmitting(true);
    try {
      let userId = formData.userId;

      // Créer l'utilisateur si nécessaire
      if (creatingUser) {
        const existingUserByEmail = users.find((u) => u.email === formData.newEmail);
        if (existingUserByEmail) {
          toast.error("Un utilisateur avec cet email existe déjà. Veuillez le sélectionner dans la liste.");
          setSubmitting(false);
          return;
        }

        if (formData.newPhone) {
          const normalizedPhone = normalizeIvoryCoastPhone(formData.newPhone);
          if (normalizedPhone) {
            const existingUserByPhone = users.find((u) => u.phone === normalizedPhone);
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
        userId = (userResponse as { user: { id: string } }).user.id;
      }

      const payload = {
        roomId: room.id,
        userId,
        guestFirstName: creatingUser ? formData.newName.split(" ")[0] : undefined,
        guestLastName: creatingUser ? formData.newName.split(" ").slice(1).join(" ") : undefined,
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
          const paymentPayload: Record<string, unknown> = {
            bookingId: (bookingResponse as { booking: { id: string } }).booking.id,
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

      onClose();
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {!fixedRoomId && (
          <div>
            <Label>Chambre *</Label>
            <Select
              value={roomId}
              onValueChange={(value) => {
                setRoomId(value);
                // Les disponibilités diffèrent par chambre : on réinitialise les dates
                setFormData((f) => ({ ...f, checkIn: "", checkOut: "" }));
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une chambre" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs
          value={creatingUser ? "new" : "existing"}
          onValueChange={(value) => {
            setCreatingUser(value === "new");
            if (value === "new") {
              setFormData({ ...formData, userId: "" });
            }
          }}
        >
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
                      // eslint-disable-next-line @next/next/no-img-element
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
          <Label>Dates du séjour &amp; voyageurs *</Label>
          {room ? (
            <HotelBookingCalendar
              className="mt-1"
              availability={formAvailabilityMap}
              basePrice={room.basePrice}
              currencyLabel={room.currency === "XOF" ? "FCFA" : room.currency}
              monthsToShow={1}
              maxGuestsPerRoom={room.maxGuests}
              allowPastDates
              initialCheckIn={formData.checkIn ? new Date(formData.checkIn) : null}
              initialCheckOut={formData.checkOut ? new Date(formData.checkOut) : null}
              onSelectionChange={(ci, co) =>
                setFormData((f) => ({
                  ...f,
                  checkIn: ci ? toDayKey(ci) : "",
                  checkOut: co ? toDayKey(co) : "",
                }))
              }
              onGuestsChange={(g) =>
                setFormData((f) => ({ ...f, adults: g.adults, children: g.children }))
              }
            />
          ) : (
            <p className="mt-1 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Sélectionnez une chambre pour afficher le calendrier des disponibilités.
            </p>
          )}
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

        {!editingBooking && (
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
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Traitement..." : editingBooking ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
