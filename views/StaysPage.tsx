"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

type Room = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  shortDescription: string | null;
  basePrice: number;
  currency: string;
  maxGuests: number;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  roomType: { id: string; slug: string; name: string } | null;
  location: { id: string; slug: string; name: string; city: string | null } | null;
};

const sorts = ["Recommandé", "Prix · croissant", "Prix · décroissant"];

export function StaysPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState(sorts[0]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ rooms: Room[] }>("/api/rooms");
        setRooms(data.rooms);
      } catch (err) {
        console.error("Erreur chargement chambres", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const names = new Set(rooms.map((r) => r.roomType?.name).filter((n): n is string => Boolean(n)));
    return ["Toutes", ...Array.from(names)];
  }, [rooms]);

  const list = useMemo(() => {
    let out = category ? rooms.filter((r) => r.roomType?.name === category) : rooms;
    if (sort === "Prix · croissant") out = [...out].sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "Prix · décroissant") out = [...out].sort((a, b) => b.basePrice - a.basePrice);
    return out;
  }, [rooms, category, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">La collection</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light text-balance leading-[1.05]">
            Chambres & Suites
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            {rooms.length} atmosphères, pensées pour chaque séjour à San Pedro.
          </p>
        </div>
      </section>

      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 overflow-x-auto scroll-fade-mask flex-1 no-scrollbar">
            {categories.map((c) => {
              const active = c === category || (c === "Toutes" && !category);
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c === "Toutes" ? null : c)}
                  className={`shrink-0 h-9 px-4 eyebrow border transition-colors whitespace-nowrap ${
                    active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="hidden md:block h-9 border border-border bg-background px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
          >
            {sorts.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-14">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground">
            <MapPin className="mx-auto h-6 w-6 mb-3" />
            Aucune chambre ne correspond à ces filtres.
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-14">
            {list.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.08 }}
              >
                <Link href={`/stays/${room.id}`} className="group block">
                  <div className="relative overflow-hidden aspect-[3/4] bg-muted">
                    <img
                      src={room.coverImageUrl || "/assets/hero.png"}
                      alt={room.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover img-zoom"
                    />
                  </div>
                  <p className="eyebrow mt-5 text-muted-foreground">
                    {room.roomType?.name || "Chambre"}
                    {room.sizeSqm ? ` · ${room.sizeSqm} m²` : ""}
                  </p>
                  <h3 className="font-display mt-2 text-2xl font-light leading-snug">
                    {room.name}
                    {room.roomNumber && <span className="text-sm text-muted-foreground ml-2">N° {room.roomNumber}</span>}
                  </h3>
                  {room.shortDescription && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{room.shortDescription}</p>
                  )}
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-lg text-primary">{room.basePrice.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{room.currency} / nuit</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
