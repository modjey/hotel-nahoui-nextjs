"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Search, BedDouble, Power, Eye, Calendar, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown } from "lucide-react";
import { getDiscountedPrice } from "@/lib/pricing";

type Room = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  currency: string;
  discountPercent: number;
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
    payments: { status: string | null }[];
    userId: string | null;
  }>;
};

export default function AdminRoomsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [locationId, setLocationId] = useState("all");
  const [roomTypeId, setRoomTypeId] = useState("all");
  const [status, setStatus] = useState("all");
  const [promo, setPromo] = useState("all");
  const [reordering, setReordering] = useState(false);
  const router = useRouter();

  // La recherche frappe l'API : petit délai pour ne pas requêter à chaque frappe.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Tout changement de filtre ramène à la première page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, locationId, roomTypeId, status, promo]);

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (locationId !== "all") params.set("locationId", locationId);
  if (roomTypeId !== "all") params.set("roomTypeId", roomTypeId);
  if (status !== "all") params.set("isPublished", status);
  if (promo !== "all") params.set("promo", promo);

  const { data, loading, error, refetch } = useApi<{ rooms: Room[]; total: number; page: number; limit: number; totalPages: number }>(`/api/admin/admin-rooms?${params.toString()}`);
  const { data: locationsData } = useApi<{ locations: { id: string; name: string; city: string | null }[] }>("/api/admin/admin-locations");
  const { data: typesData } = useApi<{ types: { id: string; name: string }[] }>("/api/admin/admin-room-types");
  const locations = locationsData?.locations ?? [];
  const roomTypes = typesData?.types ?? [];

  const hasFilters = debouncedSearch || locationId !== "all" || roomTypeId !== "all" || status !== "all" || promo !== "all";
  const resetFilters = () => {
    setSearch("");
    setLocationId("all");
    setRoomTypeId("all");
    setStatus("all");
    setPromo("all");
  };

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

  // Le réordonnancement est global (toutes les chambres confondues) : il faut
  // que la liste affichée reflète cet ordre, donc filtres désactivés pour bouger.
  const move = async (id: string, direction: "up" | "down") => {
    setReordering(true);
    try {
      await api.post("/api/admin/admin-rooms/reorder", { id, direction });
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setReordering(false);
    }
  };

  const rooms = data?.rooms ?? [];

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
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, numéro, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Localisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les localisations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roomTypeId} onValueChange={setRoomTypeId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {roomTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="true">Publiées</SelectItem>
                <SelectItem value="false">Brouillons</SelectItem>
              </SelectContent>
            </Select>
            <Select value={promo} onValueChange={setPromo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Promotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous prix</SelectItem>
                <SelectItem value="true">En promotion</SelectItem>
                <SelectItem value="false">Sans promotion</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
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
                <TableHead>Ordre</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-destructive">
                  Erreur de chargement
                </TableCell>
              </TableRow>
            ) : rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucune chambre trouvée
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((r, i) => (
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
                    {r.discountPercent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground line-through">
                          {r.basePrice.toLocaleString()} {r.currency}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {getDiscountedPrice(r.basePrice, r.discountPercent).toLocaleString()} {r.currency}
                          <Badge className="text-[10px] px-1 py-0 bg-red-600 text-white border-red-600">
                            -{r.discountPercent}%
                          </Badge>
                        </span>
                      </div>
                    ) : (
                      <>{r.basePrice.toLocaleString()} {r.currency}</>
                    )}
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
                              {b.payments?.some((p) => p.status === "SUCCESS") && (
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={reordering || !!hasFilters || (page === 1 && i === 0)}
                        onClick={() => move(r.id, "up")}
                        title={hasFilters ? "Réinitialisez les filtres pour réordonner" : "Monter"}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          reordering ||
                          !!hasFilters ||
                          (i === rooms.length - 1 && page === (data?.totalPages ?? 1))
                        }
                        onClick={() => move(r.id, "down")}
                        title={hasFilters ? "Réinitialisez les filtres pour réordonner" : "Descendre"}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
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
