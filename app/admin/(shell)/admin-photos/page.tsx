"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { Plus, Pencil, Trash2, Search, FilterX, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

type Photo = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  order: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  album: { id: string; name: string; slug: string };
  uploader: { id: string; name: string | null; email: string | null } | null;
};

export default function AdminPhotosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data, loading, error, refetch } = useApi<{ photos: Photo[]; total: number; page: number; limit: number; totalPages: number }>(`/api/admin/admin-photos?page=${page}&limit=24`);
  const { data: albumsData } = useApi<{ albums: { id: string; name: string; slug: string }[] }>("/api/admin/admin-photo-albums");

  const [search, setSearch] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string>("all");
  const [isApprovedFilter, setIsApprovedFilter] = useState<string>("all");
  const [isFeaturedFilter, setIsFeaturedFilter] = useState<string>("all");

  const deletePhoto = async (id: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    try {
      await api.del(`/api/admin/admin-photos/${id}`);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  useEffect(() => {
    if (data?.totalPages) {
      setTotalPages(data.totalPages);
    }
  }, [data]);

  const clearFilters = () => {
    setSearch("");
    setAlbumFilter("all");
    setIsApprovedFilter("all");
    setIsFeaturedFilter("all");
  };

  const hasFilters = search || albumFilter !== "all" || isApprovedFilter !== "all" || isFeaturedFilter !== "all";

  const filtered = (data?.photos ?? []).filter((photo) => {
    const matchesSearch = search
      ? [photo.title, photo.description, photo.album.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesAlbum = albumFilter !== "all" ? photo.album.id === albumFilter : true;
    const matchesApproved = isApprovedFilter !== "all" ? (isApprovedFilter === "true" ? photo.isApproved : !photo.isApproved) : true;
    const matchesFeatured = isFeaturedFilter !== "all" ? (isFeaturedFilter === "true" ? photo.isFeatured : !photo.isFeatured) : true;

    return matchesSearch && matchesAlbum && matchesApproved && matchesFeatured;
  });

  return (
    <div>
      <PageHeader
        title="Photos"
        description="Gérez les photos du photobook."
        actions={
          <Link href="/admin/admin-photos/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle photo
            </Button>
          </Link>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={albumFilter} onValueChange={setAlbumFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Album" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {albumsData?.albums.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isApprovedFilter} onValueChange={setIsApprovedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Approbation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="true">Approuvées</SelectItem>
                <SelectItem value="false">En attente</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <FilterX className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {hasFilters ? "Aucun résultat" : "Aucune photo"}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {filtered.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={photo.thumbnailUrl || photo.imageUrl}
                  alt={photo.title || "Photo"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <div className="text-white text-xs truncate">{photo.title || photo.album.name}</div>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => router.push(`/admin/admin-photos/${photo.id}`)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => deletePhoto(photo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {photo.isFeatured && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="default" className="text-xs">Vedette</Badge>
                  </div>
                )}
                {!photo.isApproved && (
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-xs">En attente</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
