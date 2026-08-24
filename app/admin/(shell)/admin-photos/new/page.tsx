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

export default function NewPhotoPage() {
  const router = useRouter();
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
  const { data: albumsData } = useApi<{ albums: { id: string; name: string; slug: string }[] }>("/api/admin/admin-photo-albums");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      alert("Veuillez sélectionner une image");
      return;
    }

    if (!formData.albumId) {
      alert("Veuillez sélectionner un album");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", new Blob(), "placeholder");
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("albumId", formData.albumId);
      formDataToSend.append("isApproved", formData.isApproved.toString());
      formDataToSend.append("isFeatured", formData.isFeatured.toString());
      formDataToSend.append("order", formData.order.toString());
      formDataToSend.append("imageUrl", formData.imageUrl);

      await fetch("/api/admin/admin-photos", {
        method: "POST",
        body: formDataToSend,
      });

      router.push("/admin/admin-photos");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nouvelle photo"
        description="Ajoutez une nouvelle photo au photobook."
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
            <Label>Image *</Label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(value) => setFormData({ ...formData, imageUrl: value })}
              folder="photos"
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
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Uploader"}
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
