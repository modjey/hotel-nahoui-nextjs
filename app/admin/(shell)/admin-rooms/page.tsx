"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, BedDouble, Power, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type Room = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  currency: string;
  maxGuests: number;
  beds: number;
  coverImageUrl: string | null;
  isPublished: boolean;
  location: { id: string; name: string; city: string | null };
  roomType: { id: string; name: string };
  bookings: Array<{
    id: string;
    reference: string | null;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    guestFirstName: string | null;
    guestLastName: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    status: string;
    payment: { status: string | null } | null;
    userId: string | null;
  }>;
};

export default function AdminRoomsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data, loading, error, refetch } = useApi<{ rooms: Room[]; total: number; page: number; limit: number; totalPages: number }>(`/api/admin/admin-rooms?page=${page}&limit=${limit}`);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const deleteRoom = async (slug: string) => {
    if (!confirm("Supprimer cette chambre ?")) return;
    try {
      await api.del(`/api/admin/admin-rooms/${slug}`);
      toast.success("Supprimée");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const togglePublish = async (slug: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/admin-rooms/${slug}`, { isPublished: !currentStatus });
      toast.success(currentStatus ? "Désactivée" : "Activée");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const filtered = (data?.rooms ?? []).filter((r) =>
    search
      ? [r.name, r.location.name, r.roomType.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  return (
    <div>
      <PageHeader
        title="Chambres"
        description="Gérez les chambres disponibles à la réservation."
        actions={
          <Link href="/admin/admin-rooms/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle chambre
            </Button>
          </Link>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, localisation, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Réservations actives</TableHead>
                <TableHead>Statut</TableHead>
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
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-destructive">
                  Erreur de chargement
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune chambre trouvée
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {r.coverImageUrl ? (
                          <img
                            src={r.coverImageUrl}
                            alt={r.name}
                            className={`h-9 w-9 rounded-lg object-cover ${!r.isPublished ? 'opacity-50 grayscale' : ''}`}
                          />
                        ) : (
                          <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground ${!r.isPublished ? 'opacity-50 grayscale' : ''}`}>
                            <BedDouble className="h-4 w-4" />
                          </div>
                        )}
                        {!r.isPublished && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
                        )}
                      </div>
                      <span className={!r.isPublished ? 'text-muted-foreground' : ''}>{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.location.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.roomType.name}</TableCell>
                  <TableCell className="font-medium">
                    {r.basePrice.toLocaleString()} {r.currency}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.maxGuests} pers · {r.beds} lit{r.beds > 1 ? "s" : ""}
                  </TableCell>
                  <TableCell>
                    {r.bookings.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Aucune réservation</span>
                    ) : (
                      <div className="space-y-1">
                        {r.bookings.slice(0, 2).map((b) => (
                          <div key={b.id} className="text-xs space-y-0.5">
                            <div className="font-medium">
                              {b.userId ? (
                                <Link href={`/admin/users/${b.userId}`} className="hover:underline">
                                  {b.guestFirstName} {b.guestLastName}
                                </Link>
                              ) : (
                                <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                                  {b.guestFirstName} {b.guestLastName}
                                </Link>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(b.checkIn), "dd MMM", { locale: fr })} - {format(new Date(b.checkOut), "dd MMM yyyy", { locale: fr })}
                            </div>
                            <div className="text-muted-foreground">
                              {b.reference ? (
                                <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                                  {b.reference}
                                </Link>
                              ) : null}
                            </div>
                            <div className="flex gap-1">
                              <Badge className={`text-[10px] px-1 py-0 ${
                                b.status === "CONFIRMED" 
                                  ? "bg-green-600 text-white border-green-600" 
                                  : "bg-yellow-600 text-white border-yellow-600"
                              }`}>
                                {b.status === "CONFIRMED" ? "Confirmé" : "En attente"}
                              </Badge>
                              {b.payment?.status === "SUCCESS" && (
                                <Badge className="text-[10px] px-1 py-0 bg-green-600 text-white border-green-600">
                                  Payé
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {r.bookings.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{r.bookings.length - 2} autre{r.bookings.length - 2 > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${
                      r.isPublished 
                        ? "bg-green-600 text-white border-green-600" 
                        : "bg-gray-600 text-white border-gray-600"
                    }`}>
                      {r.isPublished ? "Publiée" : "Brouillon"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/admin-rooms/${r.slug}/view`)}
                        title="Voir détails et historique"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/admin-rooms/${r.slug}/bookings`)}
                        title="Gérer les réservations"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublish(r.slug, r.isPublished)}
                        title={r.isPublished ? "Désactiver" : "Activer"}
                      >
                        <Power className={`h-4 w-4 ${r.isPublished ? "text-foreground" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/admin-rooms/${r.slug}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRoom(r.slug)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Affichage de {(data.page - 1) * data.limit + 1} à {Math.min(data.page * data.limit, data.total)} sur {data.total} chambres
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={data.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
