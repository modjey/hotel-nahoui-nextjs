"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewPhotoAlbumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "GALLERY" as "GALLERY" | "GUEST" | "EVENT" | "ROOM" | "AMENITY",
    coverImage: "",
    isPublished: true,
    isFeatured: false,
    order: 0,
    locationId: "",
  });
  const { data: locationsData } = useApi<{ locations: { id: string; name: string; city: string | null }[] }>("/api/admin/admin-locations");
  const locations = locationsData?.locations || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/admin/admin-photo-albums", formData);
      router.push("/admin/admin-photo-albums");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nouvel album"
        description="Créez un nouvel album photo."
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        }
      />

      <div className="rounded-2xl bg-card border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GALLERY">Galerie officielle</SelectItem>
                <SelectItem value="GUEST">Album clients</SelectItem>
                <SelectItem value="EVENT">Événement</SelectItem>
                <SelectItem value="ROOM">Chambres</SelectItem>
                <SelectItem value="AMENITY">Équipements</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Localité</Label>
            <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une localité (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc: { id: string; name: string; city: string | null }) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} {loc.city && `(${loc.city})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Image de couverture</Label>
            <ImageUpload
              value={formData.coverImage}
              onChange={(value) => setFormData({ ...formData, coverImage: value })}
              folder="albums"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order">Ordre</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label htmlFor="isPublished">Publié</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
            />
            <Label htmlFor="isFeatured">Album vedette</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer l'album"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
