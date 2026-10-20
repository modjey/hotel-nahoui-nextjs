"use client";

import { useState, useEffect } from "react";
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
import { flushPendingUploads } from "@/lib/pending-uploads";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { ArrowLeft, Trash2 } from "lucide-react";
import { trimValues } from "@/lib/utils";

export default function EditPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    albumId: "",
    isApproved: true,
    isFeatured: false,
    order: 0,
  });
  const { data: photoData, loading: photoLoading } = useApi<any>(`/api/admin/admin-photos/${id}`);
  const { data: albumsData } = useApi<{ albums: { id: string; name: string; slug: string }[] }>("/api/admin/admin-photo-albums");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (photoData) {
      setFormData({
        title: photoData.title || "",
        description: photoData.description || "",
        imageUrl: photoData.imageUrl || "",
        albumId: photoData.albumId || "",
        isApproved: photoData.isApproved ?? true,
        isFeatured: photoData.isFeatured ?? false,
        order: photoData.order || 0,
      });
    }
  }, [photoData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.albumId) {
      alert("Veuillez sélectionner un album");
      return;
    }

    setLoading(true);

    try {
      const uploaded = await flushPendingUploads();
      const imageUrl = uploaded.imageUrl ?? formData.imageUrl;
      if (!imageUrl) {
        alert("Veuillez sélectionner une image");
        return;
      }
      await api.put(`/api/admin/admin-photos/${id}`, trimValues({
        title: formData.title || null,
        description: formData.description || null,
        imageUrl,
        albumId: formData.albumId,
        isApproved: formData.isApproved,
        isFeatured: formData.isFeatured,
        order: formData.order,
      }));
      router.push("/admin/admin-photos");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette photo ?")) return;
    try {
      await api.del(`/api/admin/admin-photos/${id}`);
      router.push("/admin/admin-photos");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  };

  if (photoLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Modifier la photo"
        description="Modifiez les informations de la photo."
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
            <Label>Image</Label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(value) => setFormData({ ...formData, imageUrl: value })}
              folder="photos"
              name="imageUrl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <Label htmlFor="album">Album *</Label>
            <Select value={formData.albumId} onValueChange={(value) => setFormData({ ...formData, albumId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un album" />
              </SelectTrigger>
              <SelectContent>
                {albumsData?.albums?.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              id="isApproved"
              checked={formData.isApproved}
              onCheckedChange={(checked) => setFormData({ ...formData, isApproved: checked })}
            />
            <Label htmlFor="isApproved">Approuvée</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
            />
            <Label htmlFor="isFeatured">Photo vedette</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} className="ml-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
