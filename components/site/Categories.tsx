"use client";
import { useState, useEffect } from "react";
import { Mountain, Tent, Building2, Trees, Landmark, Home, Bed, Hotel, MapPin, LucideIcon, Grid3x3 } from "lucide-react";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, LucideIcon> = {
  "Suite": Bed,
  "Chambre": Home,
  "Appartement": Building2,
  "Villa": Home,
  "Hôtel": Hotel,
  "Bungalow": Tent,
  "Maison": Home,
  "Pavillon": Home,
  "Chambre d'hôte": Bed,
  "Riad": Landmark,
  "Studio": Building2,
  "Loft": Building2,
  "Maison de ville": Building2,
  "Chalet": Mountain,
  "Cabane": Trees,
  "Gîte": Home,
  "default": MapPin,
};

export function Categories({ selectedCategory, onSelectCategory }: { selectedCategory: string | null; onSelectCategory: (category: string | null) => void }) {
  const [categories, setCategories] = useState<{ icon: LucideIcon; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ rooms: { roomType: { name: string } | null }[] }>("/api/rooms", { cache: "no-store" });
        const uniqueTypes = new Set(data.rooms.map((r) => r.roomType?.name).filter((name): name is string => Boolean(name)));
        const cats = Array.from(uniqueTypes).map((name) => ({
          icon: iconMap[name] || iconMap.default,
          label: name,
        }));
        setCategories([{ icon: Grid3x3, label: "Tout" }, ...cats]);
      } catch (err) {
        console.error("Erreur chargement catégories:", err);
        setCategories([{ icon: Grid3x3, label: "Tout" }]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClick = (category: string) => {
    if (category === "Tout") {
      onSelectCategory(null);
    } else {
      onSelectCategory(category === selectedCategory ? null : category);
    }
    // Scroll to FeaturedStays section
    document.getElementById('stays')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="border-b border-border bg-background/95 sticky top-20 z-40 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">

        {/* Mobile: thin bordered tabs */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto py-4 no-scrollbar">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-20 shrink-0" />
            ))
          ) : categories.map((c) => {
            const active = c.label === selectedCategory || (c.label === "Tout" && !selectedCategory);
            return (
              <button
                key={c.label}
                onClick={() => handleClick(c.label)}
                className={`shrink-0 h-9 px-4 eyebrow border transition-colors whitespace-nowrap ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Desktop: icon + label + underline tabs */}
        <div className="hidden md:flex items-center justify-start lg:justify-center gap-8 overflow-x-auto py-6 no-scrollbar">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-px w-full" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <span className="text-sm text-muted-foreground">Aucune catégorie</span>
          ) : (
            categories.map((c) => (
              <button
                key={c.label}
                onClick={() => handleClick(c.label)}
                className={`flex flex-col items-center gap-2.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors group ${c.label === selectedCategory ? "text-foreground" : ""}`}
              >
                <c.icon className="h-5 w-5 stroke-[1.25]" />
                <span className="eyebrow whitespace-nowrap">{c.label}</span>
                <span className={`h-px w-full ${c.label === selectedCategory ? "bg-foreground" : "bg-transparent group-hover:bg-border"} transition-colors`} />
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
