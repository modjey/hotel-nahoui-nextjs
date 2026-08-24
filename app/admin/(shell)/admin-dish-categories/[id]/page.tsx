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
import { api, ApiError } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isPublished: boolean;
};

export default function AdminDishCategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCategory = useCallback(async () => {
    try {
      const data = await api.get<{ category: Category }>(`/api/admin/admin-dish-categories/${id}`);
      setCategory(data.category);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  const update = useMutation<{ category: Category }, any>(
    `/api/admin/admin-dish-categories/${id}`,
    { method: "PATCH", onSuccess: () => toast.success("Mis à jour") },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      ...raw,
      isPublished: raw.isPublished === "on",
      order: raw.order ? Number(raw.order) : undefined,
    };

    try {
      await update.mutate(payload);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const deleteCategory = async () => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await api.del(`/api/admin/admin-dish-categories/${id}`);
      toast.success("Supprimée");
      router.push("/admin/admin-dish-categories");
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

  if (!category) return <div className="text-destructive">Catégorie introuvable</div>;

  return (
    <div>
      <Link
        href="/admin/admin-dish-categories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux catégories
      </Link>

      <PageHeader
        title={`Modifier ${category.name}`}
        description="Mettez à jour les informations de la catégorie."
        actions={
          <Button type="button" variant="destructive" onClick={deleteCategory}>
            Supprimer
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Informations générales</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={category.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={category.description || ""} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="order">Ordre</Label>
            <Input id="order" name="order" type="number" defaultValue={category.order} />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Publication</h2>
          <div className="flex items-center gap-2">
            <Switch id="isPublished" name="isPublished" defaultChecked={category.isPublished} />
            <Label htmlFor="isPublished">Publiée</Label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/admin-dish-categories")}>
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
