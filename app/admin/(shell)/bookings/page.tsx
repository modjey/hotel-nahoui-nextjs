"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { Search, Eye, CheckCircle, XCircle, Clock, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminRoom {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
}

interface Booking {
  id: string;
  reference: string;
  userId: string | null;
  roomId: string;
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
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  room?: {
    slug: string;
    name: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    reference: string;
    method: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  CANCELLED: XCircle,
  COMPLETED: CheckCircle,
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    roomId: "",
    checkIn: "",
    checkOut: "",
    adults: "1",
    children: "0",
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    status: "PENDING",
  });

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<BookingsResponse>("/api/admin/admin-bookings", {
        params: {
          page: page.toString(),
          limit: "10",
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      console.log('=== BOOKINGS RESPONSE ===', response);
      setBookings(response.bookings);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      if (error instanceof ApiError) {
        console.error('API Error:', error.code, error.message, error.status);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    setTimeout(() => {
      fetchBookings();
    }, 0);
  }, [fetchBookings]);

  const fetchRooms = async () => {
    try {
      const response = await api.get<{ rooms: AdminRoom[] }>("/api/admin/admin-rooms", {
        params: { limit: "100" },
      });
      setRooms(response.rooms);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erreur lors du chargement des chambres");
    }
  };

  const openCreateModal = () => {
    setCreateOpen(true);
    if (rooms.length === 0) fetchRooms();
  };

  const createBooking = async () => {
    if (!createForm.roomId || !createForm.checkIn || !createForm.checkOut || !createForm.guestFirstName || !createForm.guestLastName) {
      toast.error("Chambre, dates, prénom et nom sont requis");
      return;
    }

    setCreating(true);
    try {
      await api.post("/api/admin/admin-bookings", {
        roomId: createForm.roomId,
        checkIn: createForm.checkIn,
        checkOut: createForm.checkOut,
        adults: parseInt(createForm.adults, 10),
        children: parseInt(createForm.children, 10),
        guestFirstName: createForm.guestFirstName,
        guestLastName: createForm.guestLastName,
        guestEmail: createForm.guestEmail || null,
        guestPhone: createForm.guestPhone || null,
        status: createForm.status,
      });
      toast.success("Réservation créée sans paiement");
      setCreateOpen(false);
      setCreateForm({
        roomId: "",
        checkIn: "",
        checkOut: "",
        adults: "1",
        children: "0",
        guestFirstName: "",
        guestLastName: "",
        guestEmail: "",
        guestPhone: "",
        status: "PENDING",
      });
      fetchBookings();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, reference: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      PENDING: "En attente",
      CONFIRMED: "Confirmée",
      CANCELLED: "Annulée",
    };
    if (!confirm(`Changer le statut de la réservation ${reference} vers ${statusLabels[newStatus]} ?`)) return;
    try {
      await api.patch(`/api/admin/admin-bookings?id=${bookingId}`, { status: newStatus });
      toast.success(`Réservation ${statusLabels[newStatus]}`);
      fetchBookings();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erreur lors de la mise à jour");
    }
  };

  return (
    <div>
      <PageHeader
        title="Réservations"
        description="Suivez les réservations en cours, à venir et passées."
        actions={
          <Button onClick={openCreateModal}>
            Créer une réservation
          </Button>
        }
      />

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Créer une réservation</h2>
                <p className="text-sm text-muted-foreground">La réservation sera créée sans paiement.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCreateOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Chambre</label>
                <Select value={createForm.roomId} onValueChange={(value) => setCreateForm((form) => ({ ...form, roomId: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une chambre" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Arrivée</label>
                <Input type="datetime-local" value={createForm.checkIn} onChange={(e) => setCreateForm((form) => ({ ...form, checkIn: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Départ</label>
                <Input type="datetime-local" value={createForm.checkOut} onChange={(e) => setCreateForm((form) => ({ ...form, checkOut: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Adultes</label>
                <Input type="number" min="1" value={createForm.adults} onChange={(e) => setCreateForm((form) => ({ ...form, adults: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Enfants</label>
                <Input type="number" min="0" value={createForm.children} onChange={(e) => setCreateForm((form) => ({ ...form, children: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Prénom</label>
                <Input value={createForm.guestFirstName} onChange={(e) => setCreateForm((form) => ({ ...form, guestFirstName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input value={createForm.guestLastName} onChange={(e) => setCreateForm((form) => ({ ...form, guestLastName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={createForm.guestEmail} onChange={(e) => setCreateForm((form) => ({ ...form, guestEmail: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <Input value={createForm.guestPhone} onChange={(e) => setCreateForm((form) => ({ ...form, guestPhone: e.target.value }))} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={createForm.status} onValueChange={(value) => setCreateForm((form) => ({ ...form, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="CANCELLED">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button onClick={createBooking} disabled={creating} className="flex-1">
                {creating ? "Création..." : "Créer sans paiement"}
              </Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, client..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Chambre</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune réservation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.reference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.guestFirstName && booking.guestLastName
                            ? `${booking.guestFirstName} ${booking.guestLastName}`
                            : booking.user?.name || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.guestEmail || booking.user?.email || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.room?.slug ? (
                        <Link href={`/admin/admin-rooms/${booking.room.slug}`} className="hover:underline">
                          {booking.room.name || "N/A"}
                        </Link>
                      ) : (
                        <span>{booking.room?.name || "N/A"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(booking.checkIn), "dd MMM yyyy", { locale: fr })}</div>
                        <div className="text-xs text-muted-foreground">→ {format(new Date(booking.checkOut), "dd MMM yyyy", { locale: fr })}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking.payment ? `${new Intl.NumberFormat("fr-FR").format(booking.payment.amount)} ${booking.payment.currency}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 ${
                        booking.status === "CONFIRMED" 
                          ? "bg-green-600 text-white border-green-600" 
                          : booking.status === "PENDING" 
                          ? "bg-yellow-600 text-white border-yellow-600" 
                          : booking.status === "CANCELLED" 
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-blue-600 text-white border-blue-600"
                      }`}>
                        {React.createElement(statusIcons[booking.status] || Clock, { className: "h-3 w-3" })}
                        {statusLabels[booking.status] || booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/bookings/${booking.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {booking.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateBookingStatus(booking.id, booking.reference, "CANCELLED")}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateBookingStatus(booking.id, booking.reference, "PENDING")}
                              className="text-yellow-600 hover:text-yellow-600 hover:bg-yellow-600/10"
                              title="Mettre en attente"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateBookingStatus(booking.id, booking.reference, "CANCELLED")}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {totalPages > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
