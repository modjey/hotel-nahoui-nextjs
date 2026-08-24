"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { useMutation } from "@/hooks/use-api";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { locationUpdateSchema } from "@/lib/catalog/schemas";
import { z } from "zod";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AmenitiesInput } from "@/components/admin/AmenitiesInput";
import { MediaGallery, type MediaItem } from "@/components/admin/MediaGallery";

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
  media: MediaItem[];
};

export default function AdminLocationEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [loc, setLoc] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  const loadLocation = useCallback(async () => {
    try {
      const data = await api.get<{ location: Location }>(`/api/admin/admin-locations/${slug}`);
      setLoc(data.location);
      setCoverImageUrl(data.location.coverImageUrl ?? "");
      setAmenities(data.location.amenities ?? []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const update = useMutation<{ location: Location }, z.infer<typeof locationUpdateSchema>>(
    `/api/admin/admin-locations/${slug}`,
    { method: "PATCH", onSuccess: () => toast.success("Mis à jour") },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const data = {
      ...raw,
      coverImageUrl: coverImageUrl || null,
      amenities,
      isPublished: raw.isPublished === "on",
      isFeatured: raw.isFeatured === "on",
      latitude: raw.latitude ? Number(raw.latitude) : null,
      longitude: raw.longitude ? Number(raw.longitude) : null,
    };

    const result = locationUpdateSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, msgs]) => {
        toast.error(`${field}: ${msgs?.join(", ")}`);
      });
      return;
    }

    await update.mutate(result.data);
  };

  const deleteLocation = async () => {
    if (!confirm("Supprimer cette localisation ?")) return;
    try {
      await api.del(`/api/admin/admin-locations/${slug}`);
      toast.success("Supprimé");
      router.push("/admin/admin-locations");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!loc) return <div className="text-destructive">Localisation introuvable</div>;

  return (
    <div>
      <Link
        href="/admin/admin-locations"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux localisations
      </Link>

      <PageHeader
        title={`Modifier ${loc.name}`}
        description="Mettez à jour les informations, l'image principale et la galerie média."
        actions={
          <Button type="button" variant="destructive" onClick={deleteLocation}>
            Supprimer
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Informations générales</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" defaultValue={loc.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={loc.shortDescription ?? ""}
              maxLength={280}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={loc.description ?? ""}
              rows={5}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Localisation & contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" defaultValue={loc.address ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" name="city" defaultValue={loc.city ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" name="country" defaultValue={loc.country ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={loc.latitude ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={loc.longitude ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mapLink">Lien carte (Google Maps, etc.)</Label>
            <Input
              id="mapLink"
              name="mapLink"
              type="url"
              placeholder="https://maps.google.com/..."
              defaultValue={loc.mapLink ?? ""}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" defaultValue={loc.phone ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={loc.email ?? ""} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Image principale & équipements</h2>
          <div className="grid gap-2">
            <Label>Image de couverture</Label>
            <ImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder="locations"
            />
          </div>
          <div className="grid gap-2">
            <Label>Équipements</Label>
            <AmenitiesInput
              value={amenities}
              onChange={setAmenities}
              suggestions={["Wi-Fi", "Piscine", "Restaurant", "Parking", "Spa", "Salle de sport", "Navette"]}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Galerie média</h2>
            <span className="text-xs text-muted-foreground">
              {loc.media.length} élément{loc.media.length > 1 ? "s" : ""}
            </span>
          </div>
          <MediaGallery
            locationId={loc.id}
            media={loc.media}
            onChange={loadLocation}
            folder="locations"
          />
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Publication</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="isPublished" name="isPublished" defaultChecked={loc.isPublished} />
              <Label htmlFor="isPublished">Publiée</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isFeatured" name="isFeatured" defaultChecked={loc.isFeatured} />
              <Label htmlFor="isFeatured">Vedette</Label>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/admin-locations")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={update.loading}>
            {update.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
