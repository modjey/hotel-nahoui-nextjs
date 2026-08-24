"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";

type Album = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

export default function SubmitPhotoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    albumId: "",
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch("/api/photobook/albums?isPublished=true");
      const data = await response.json();
      if (data.success) {
        setAlbums(data.data.albums);
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/admin-photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          isApproved: false, // Requires moderation
          isFeatured: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert("Erreur lors de la soumission: " + (data.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Error submitting photo:", error);
      alert("Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="pt-8 px-6 max-w-2xl mx-auto">
          <div className="text-center py-16">
            <CheckCircle className="h-20 w-20 mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl font-display mb-4">Photo soumise avec succès !</h1>
            <p className="text-muted-foreground mb-8">
              Votre photo a été soumise pour modération. Elle sera visible après validation par notre équipe.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/photobook")}>
                Retour au photobook
              </Button>
              <Button variant="outline" onClick={() => {
                setSubmitted(false);
                setFormData({ title: "", description: "", imageUrl: "", albumId: "" });
              }}>
                Soumettre une autre photo
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      
      <div className="pt-8 px-6 max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="rounded-2xl bg-card border border-border p-8">
          <h1 className="text-3xl font-display mb-2">Soumettre une photo</h1>
          <p className="text-muted-foreground mb-8">
            Partagez vos souvenirs avec la communauté Hotel Nahoui
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label>Photo *</Label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(value) => setFormData({ ...formData, imageUrl: value })}
                folder="photos"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Coucher de soleil à Assinie"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre photo..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="album">Album *</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) => setFormData({ ...formData, albumId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-2">Règles de soumission :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Votre photo sera soumise pour modération</li>
                <li>Les photos inappropriées seront rejetées</li>
                <li>Vous devez être propriétaire de la photo</li>
                <li>Formats acceptés: JPG, PNG, WEBP</li>
              </ul>
            </div>

            <Button type="submit" disabled={loading || !formData.imageUrl || !formData.title || !formData.albumId} className="w-full">
              {loading ? "Soumission..." : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Soumettre la photo
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
