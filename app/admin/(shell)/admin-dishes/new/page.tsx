"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { api } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { slugify } from "@/lib/catalog/schemas";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

type CategoryOption = { id: string; name: string };
type LocationOption = { id: string; name: string; city: string | null };

export default function NewDishPage() {
  const router = useRouter();
  const { data: categoriesData } = useApi<{ categories: CategoryOption[] }>("/api/admin/admin-dish-categories");
  const { data: locsData } = useApi<{ locations: LocationOption[] }>("/api/admin/admin-locations");

  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const [imageUrl, setImageUrl] = useState("");

  const create = useMutation<{ dish: { id: string; slug: string } }, any>(
    "/api/admin/admin-dishes",
    {
      onSuccess: (res) => {
        toast.success("Plat créé");
        router.push(`/admin/admin-dishes/${res.dish.id}`);
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      ...raw,
      categoryId,
      locationId,
      currency,
      imageUrl: imageUrl || null,
      isAvailable: raw.isAvailable === "on",
      isPublished: raw.isPublished === "on",
      isFeatured: raw.isFeatured === "on",
      price: raw.price ? Number(raw.price) : 0,
      order: raw.order ? Number(raw.order) : 0,
    };

    try {
      await create.mutate(payload);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div>
      <Link
        href="/admin/admin-dishes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux plats
      </Link>

      <PageHeader
        title="Nouveau plat"
        description="Ajoutez un nouveau plat au menu du restaurant."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Informations générales</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Prix</Label>
              <Input id="price" name="price" type="number" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="order">Ordre</Label>
            <Input id="order" name="order" type="number" defaultValue={0} />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Catégorie & Localité</h2>
          <div className="grid gap-2">
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="locationId">Localité</Label>
            <Select value={locationId} onValueChange={setLocationId} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locsData?.locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} {loc.city && `(${loc.city})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Image</h2>
          <div className="grid gap-2">
            <Label>Image du plat</Label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} folder="dishes" />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Publication</h2>
          <div className="flex items-center gap-2">
            <Switch id="isAvailable" name="isAvailable" defaultChecked />
            <Label htmlFor="isAvailable">Disponible</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isPublished" name="isPublished" defaultChecked />
            <Label htmlFor="isPublished">Publier immédiatement</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isFeatured" name="isFeatured" defaultChecked />
            <Label htmlFor="isFeatured">À la une</Label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/admin-dishes")}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.loading}>
            {create.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer le plat
          </Button>
        </div>
      </form>
    </div>
  );
}
