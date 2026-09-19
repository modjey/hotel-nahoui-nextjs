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
import { Search, Eye, CheckCircle, XCircle, Clock, Pencil } from "lucide-react";
import { BookingFormDialog } from "@/components/admin/BookingFormDialog";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminRoom {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
  basePrice: number;
  currency: string;
  bookings: { id: string; checkIn: string; checkOut: string; status: string }[];
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
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);

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
    setEditingBooking(null);
    setCreateOpen(true);
    if (rooms.length === 0) fetchRooms();
  };

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setCreateOpen(true);
    if (rooms.length === 0) fetchRooms();
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

      <BookingFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        rooms={rooms}
        editingBooking={editingBooking}
        onSaved={fetchBookings}
      />


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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(booking)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
