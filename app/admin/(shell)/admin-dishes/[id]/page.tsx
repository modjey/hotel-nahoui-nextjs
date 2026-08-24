"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { api, ApiError } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

type Dish = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  category: { id: string; name: string };
  location: { id: string; name: string };
};

type CategoryOption = { id: string; name: string };
type LocationOption = { id: string; name: string; city: string | null };

export default function AdminDishEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [currency, setCurrency] = useState("XOF");

  const { data: categoriesData } = useApi<{ categories: CategoryOption[] }>("/api/admin/admin-dish-categories");
  const { data: locsData } = useApi<{ locations: LocationOption[] }>("/api/admin/admin-locations");

  const loadDish = useCallback(async () => {
    try {
      const data = await api.get<{ dish: Dish }>(`/api/admin/admin-dishes/${id}`);
      setDish(data.dish);
      setImageUrl(data.dish.imageUrl ?? "");
      setCategoryId(data.dish.category.id);
      setLocationId(data.dish.location.id);
      setCurrency(data.dish.currency);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDish();
  }, [loadDish]);

  const update = useMutation<{ dish: Dish }, any>(
    `/api/admin/admin-dishes/${id}`,
    { method: "PATCH", onSuccess: () => toast.success("Mis à jour") },
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
      price: raw.price ? Number(raw.price) : undefined,
      order: raw.order ? Number(raw.order) : undefined,
    };

    try {
      await update.mutate(payload);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const deleteDish = async () => {
    if (!confirm("Supprimer ce plat ?")) return;
    try {
      await api.del(`/api/admin/admin-dishes/${id}`);
      toast.success("Supprimé");
      router.push("/admin/admin-dishes");
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

  if (!dish) return <div className="text-destructive">Plat introuvable</div>;

  return (
    <div>
      <Link
        href="/admin/admin-dishes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux plats
      </Link>

      <PageHeader
        title={`Modifier ${dish.name}`}
        description="Mettez à jour les informations du plat."
        actions={
          <Button type="button" variant="destructive" onClick={deleteDish}>
            Supprimer
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Informations générales</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={dish.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={dish.description || ""} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Prix</Label>
              <Input id="price" name="price" type="number" defaultValue={dish.price} required />
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
            <Input id="order" name="order" type="number" defaultValue={dish.order} />
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
            <Switch id="isAvailable" name="isAvailable" defaultChecked={dish.isAvailable} />
            <Label htmlFor="isAvailable">Disponible</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isPublished" name="isPublished" defaultChecked={dish.isPublished} />
            <Label htmlFor="isPublished">Publiée</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isFeatured" name="isFeatured" defaultChecked={dish.isFeatured} />
            <Label htmlFor="isFeatured">À la une</Label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/admin-dishes")}>
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
