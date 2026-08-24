"use client";

import { useState } from "react";
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
import { Plus, Pencil, Trash2, Search, FilterX, Image as ImageIcon } from "lucide-react";

type PhotoAlbum = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: "GALLERY" | "GUEST" | "EVENT" | "ROOM" | "AMENITY";
  coverImage: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  location: { id: string; name: string; city: string | null } | null;
  _count: { photos: number };
  createdAt: string;
};

const albumTypeLabels: Record<string, string> = {
  GALLERY: "Galerie",
  GUEST: "Album clients",
  EVENT: "Événement",
  ROOM: "Chambres",
  AMENITY: "Équipements",
};

const albumTypeColors: Record<string, string> = {
  GALLERY: "default",
  GUEST: "secondary",
  EVENT: "outline",
  ROOM: "destructive",
  AMENITY: "default",
};

export default function AdminPhotoAlbumsPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApi<{ albums: PhotoAlbum[] }>("/api/admin/admin-photo-albums");
  const { data: locationsData } = useApi<{ locations: { id: string; name: string; city: string | null }[] }>("/api/admin/admin-locations");
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isPublishedFilter, setIsPublishedFilter] = useState<string>("all");

  const deleteAlbum = async (id: string) => {
    if (!confirm("Supprimer cet album et toutes ses photos ?")) return;
    try {
      await api.del(`/api/admin/admin-photo-albums/${id}`);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setLocationFilter("all");
    setIsPublishedFilter("all");
  };

  const hasFilters = search || typeFilter !== "all" || locationFilter !== "all" || isPublishedFilter !== "all";

  const filtered = (data?.albums ?? []).filter((album) => {
    const matchesSearch = search
      ? [album.name, album.description, album.location?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesType = typeFilter !== "all" ? album.type === typeFilter : true;
    const matchesLocation = locationFilter !== "all" ? album.location?.id === locationFilter : true;
    const matchesPublished = isPublishedFilter !== "all" ? (isPublishedFilter === "true" ? album.isPublished : !album.isPublished) : true;

    return matchesSearch && matchesType && matchesLocation && matchesPublished;
  });

  return (
    <div>
      <PageHeader
        title="Albums photo"
        description="Gérez les albums du photobook."
        actions={
          <Link href="/admin/admin-photo-albums/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvel album
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(albumTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Localité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {locationsData?.locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} {loc.city && `(${loc.city})`}
                  </SelectItem>
                ))}
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
            {hasFilters ? "Aucun résultat" : "Aucun album"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((album) => (
              <div key={album.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{album.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {album.location?.name} {album.location?.city && `(${album.location.city})`}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={albumTypeColors[album.type] as any}>
                      {albumTypeLabels[album.type]}
                    </Badge>
                    <Badge variant={album.isPublished ? "default" : "secondary"}>
                      {album._count.photos} photos
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {album.isFeatured && (
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      Vedette
                    </span>
                  )}
                  {!album.isPublished && (
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      Brouillon
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/admin/admin-photo-albums/${album.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlbum(album.id)}
                    className="text-destructive hover:text-destructive"
                  >
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
