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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  transactionId: string | null;
  paymentMethod: string | null;
  createdAt: string;
  booking?: {
    id: string;
    reference: string;
    status: string;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
    };
    room?: {
      slug: string;
      name: string;
    };
  };
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  SUCCESS: "Réussi",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  SUCCESS: "default",
  FAILED: "destructive",
  REFUNDED: "outline",
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  REFUNDED: CheckCircle,
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<PaymentsResponse>("/api/admin/admin-payments", {
        params: {
          page: page.toString(),
          limit: "10",
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      setPayments(response.payments);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    setTimeout(() => {
      fetchPayments();
    }, 0);
  }, [fetchPayments]);

  const openViewDialog = (payment: Payment) => {
    setViewingPayment(payment);
    setIsViewDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Suivez les transactions de paiement des réservations."
      />

      <div className="rounded-2xl bg-card border border-border">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, transaction..."
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
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Réservation</TableHead>
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
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.reference}
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("fr-FR").format(payment.amount)} {payment.currency}
                    </TableCell>
                    <TableCell>{payment.paymentMethod || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.transactionId || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div>
                        {payment.booking?.id ? (
                          <Link href={`/admin/bookings/${payment.booking.id}`} className="font-medium hover:underline">
                            {payment.booking.reference || "N/A"}
                          </Link>
                        ) : (
                          <div className="font-medium">{payment.booking?.reference || "N/A"}</div>
                        )}
                        {payment.booking?.user?.id ? (
                          <div className="text-xs text-muted-foreground">
                            <Link href={`/admin/users/${payment.booking.user.id}`} className="hover:underline">
                              {payment.booking.user.name || "N/A"}
                            </Link>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">{payment.booking?.user?.name || "N/A"}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 ${
                        payment.status === "SUCCESS" 
                          ? "bg-green-600 text-white border-green-600" 
                          : payment.status === "PENDING" 
                          ? "bg-yellow-600 text-white border-yellow-600" 
                          : payment.status === "FAILED" 
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-blue-600 text-white border-blue-600"
                      }`}>
                        {React.createElement(statusIcons[payment.status] || Clock, { className: "h-3 w-3" })}
                        {statusLabels[payment.status] || payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
            <DialogDescription>
              Référence: {viewingPayment?.reference}
            </DialogDescription>
          </DialogHeader>
          {viewingPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Badge className={`mt-1 ${
                    viewingPayment.status === "SUCCESS" 
                      ? "bg-green-600 text-white border-green-600" 
                      : viewingPayment.status === "PENDING" 
                      ? "bg-yellow-600 text-white border-yellow-600" 
                      : viewingPayment.status === "FAILED" 
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-blue-600 text-white border-blue-600"
                  }`}>
                    {statusLabels[viewingPayment.status] || viewingPayment.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Méthode de paiement</Label>
                  <div className="font-medium">{viewingPayment.paymentMethod || "N/A"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <div className="font-medium text-sm">{viewingPayment.transactionId || "N/A"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Créé le</Label>
                  <div className="font-medium">{format(new Date(viewingPayment.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}</div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <Label className="text-muted-foreground mb-2 block">Montant</Label>
                <div className="font-display text-3xl">
                  {new Intl.NumberFormat("fr-FR").format(viewingPayment.amount)} {viewingPayment.currency}
                </div>
              </div>
              {viewingPayment.booking && (
                <div className="border-t border-border pt-4">
                  <Label className="text-muted-foreground mb-2 block">Réservation associée</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Référence</Label>
                      <div className="font-medium">{viewingPayment.booking.reference}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Client</Label>
                      <div className="font-medium">{viewingPayment.booking.user?.name || "N/A"}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Chambre</Label>
                      <div className="font-medium">{viewingPayment.booking.room?.name || "N/A"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
