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
import { api } from "@/lib/api-client";
import { useMutation } from "@/hooks/use-api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewDishCategoryPage() {
  const router = useRouter();

  const create = useMutation<{ category: { id: string; slug: string } }, any>(
    "/api/admin/admin-dish-categories",
    {
      onSuccess: (res) => {
        toast.success("Catégorie créée");
        router.push(`/admin/admin-dish-categories/${res.category.id}`);
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      ...raw,
      isPublished: raw.isPublished === "on",
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
        href="/admin/admin-dish-categories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux catégories
      </Link>

      <PageHeader
        title="Nouvelle catégorie"
        description="Créez une nouvelle catégorie de plats."
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
          <div className="grid gap-2">
            <Label htmlFor="order">Ordre</Label>
            <Input id="order" name="order" type="number" defaultValue={0} />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Publication</h2>
          <div className="flex items-center gap-2">
            <Switch id="isPublished" name="isPublished" defaultChecked />
            <Label htmlFor="isPublished">Publier immédiatement</Label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/admin-dish-categories")}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.loading}>
            {create.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer la catégorie
          </Button>
        </div>
      </form>
    </div>
  );
}
