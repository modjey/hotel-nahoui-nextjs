"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isPublished: boolean;
};

export default function AdminDishCategoriesPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApi<{ categories: Category[] }>("/api/admin/admin-dish-categories");
  const [search, setSearch] = useState("");

  const deleteCategory = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await api.del(`/api/admin/admin-dish-categories/${id}`);
      toast.success("Supprimé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const filtered = (data?.categories ?? []).filter((c) =>
    search
      ? [c.name, c.description].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div>
      <PageHeader
        title="Catégories de plats"
        description="Gérez les catégories du menu du restaurant."
        actions={
          <Link href="/admin/admin-dish-categories/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </Link>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? "Aucun résultat" : "Aucune catégorie"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((category) => (
              <div key={category.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-muted-foreground">{category.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!category.isPublished && (
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      Brouillon
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/admin/admin-dish-categories/${category.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCategory(category.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
