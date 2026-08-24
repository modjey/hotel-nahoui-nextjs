"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, FilterX, Power } from "lucide-react";

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

export default function AdminDishesPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApi<{ dishes: Dish[] }>("/api/admin/admin-dishes");
  const { data: categoriesData } = useApi<{ categories: { id: string; name: string }[] }>("/api/admin/admin-dish-categories");
  const { data: locationsData } = useApi<{ locations: { id: string; name: string; city: string | null }[] }>("/api/admin/admin-locations");
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const deleteDish = async (id: string) => {
    if (!confirm("Supprimer ce plat ?")) return;
    try {
      await api.del(`/api/admin/admin-dishes/${id}`);
      toast.success("Supprimé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/admin-dishes/${id}`, { isAvailable: !currentStatus });
      toast.success(currentStatus ? "Désactivé" : "Activé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setLocationFilter("");
  };

  const hasFilters = search || categoryFilter || locationFilter;

  const filtered = (data?.dishes ?? []).filter((d) => {
    const matchesSearch = search
      ? [d.name, d.category.name, d.location.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      : true;
    
    const matchesCategory = categoryFilter ? d.category.id === categoryFilter : true;
    const matchesLocation = locationFilter ? d.location.id === locationFilter : true;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div>
      <PageHeader
        title="Plats"
        description="Gérez les plats du restaurant."
        actions={
          <Link href="/admin/admin-dishes/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau plat
            </Button>
          </Link>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Localité" />
              </SelectTrigger>
              <SelectContent>
                {locationsData?.locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} {loc.city && `(${loc.city})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <FilterX className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? "Aucun résultat" : "Aucun plat"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((dish) => (
              <div key={dish.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  {dish.imageUrl && (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium">{dish.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {dish.category.name} • {dish.location.name}
                    </div>
                    <div className="text-sm font-medium">
                      {dish.price.toLocaleString()} {dish.currency}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!dish.isPublished && (
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      Brouillon
                    </span>
                  )}
                  {!dish.isAvailable && (
                    <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                      Indisponible
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAvailability(dish.id, dish.isAvailable)}
                    title={dish.isAvailable ? "Désactiver" : "Activer"}
                  >
                    <Power className={`h-4 w-4 ${dish.isAvailable ? "text-foreground" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/admin/admin-dishes/${dish.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDish(dish.id)}
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
