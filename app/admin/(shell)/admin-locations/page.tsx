"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { locationCreateSchema } from "@/lib/catalog/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";

type Location = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  mapLink: string | null;
  phone: string | null;
  email: string | null;
  coverImageUrl: string | null;
  amenities: string[];
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  _count: { rooms: number };
};

export default function AdminLocationsPage() {
  const { data, loading, error, refetch } = useApi<{ locations: Location[] }>(
    "/api/admin/admin-locations",
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const create = useMutation<{ location: Location }, z.infer<typeof locationCreateSchema>>(
    "/api/admin/admin-locations",
    {
      onSuccess: () => {
        toast.success("Localisation créée");
        setOpen(false);
        refetch();
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const amenitiesStr = raw.amenities as string;

    const data = {
      ...raw,
      amenities: amenitiesStr ? amenitiesStr.split(",").map((a) => a.trim()).filter(Boolean) : [],
      isPublished: raw.isPublished === "on",
      isFeatured: raw.isFeatured === "on",
      latitude: raw.latitude ? Number(raw.latitude) : null,
      longitude: raw.longitude ? Number(raw.longitude) : null,
      order: raw.order ? Number(raw.order) : 0,
    };

    const result = locationCreateSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, msgs]) => {
        toast.error(`${field}: ${msgs?.join(", ")}`);
      });
      return;
    }

    await create.mutate(result.data);
  };

  const deleteLocation = async (slug: string) => {
    if (!confirm("Supprimer cette localisation ?")) return;
    try {
      await api.del(`/api/admin/admin-locations/${slug}`);
      toast.success("Supprimée");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const filtered = (data?.locations ?? []).filter((l) =>
    search
      ? [l.name, l.city, l.country].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div>
      <PageHeader
        title="Localisations"
        description="Gérez les sites physiques de l'hôtel."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Nouvelle localisation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle localisation</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau site physique au catalogue.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (optionnel)</Label>
                    <Input id="slug" name="slug" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortDescription">Description courte</Label>
                  <Input id="shortDescription" name="shortDescription" maxLength={280} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" name="address" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" name="city" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input id="country" name="country" defaultValue="Côte d'Ivoire" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="coverImageUrl">URL image de couverture</Label>
                    <Input id="coverImageUrl" name="coverImageUrl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" name="latitude" type="number" step="any" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" name="longitude" type="number" step="any" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mapLink">Lien carte (Google Maps, etc.)</Label>
                  <Input id="mapLink" name="mapLink" type="url" placeholder="https://maps.google.com/..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amenities">Équipements (séparés par virgule)</Label>
                  <Input id="amenities" name="amenities" placeholder="Piscine, Restaurant, Wi-Fi..." />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch id="isPublished" name="isPublished" defaultChecked />
                    <Label htmlFor="isPublished">Publiée</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="isFeatured" name="isFeatured" />
                    <Label htmlFor="isFeatured">Vedette</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={create.loading}>
                    Créer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, ville, pays..."
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
                <TableHead>Ville</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Chambres</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-destructive">
                  Erreur de chargement
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune localisation trouvée
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {loc.coverImageUrl ? (
                        <img
                          src={loc.coverImageUrl}
                          alt={loc.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                        </div>
                      )}
                      <span>{loc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{loc.city || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.country || "—"}</TableCell>
                  <TableCell>{loc._count.rooms}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={loc.isPublished ? "default" : "secondary"}>
                        {loc.isPublished ? "Publiée" : "Brouillon"}
                      </Badge>
                      {loc.isFeatured && <Badge variant="outline">Vedette</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/admin-locations/${loc.slug}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLocation(loc.slug)}
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
      </div>
    </div>
  );
}
