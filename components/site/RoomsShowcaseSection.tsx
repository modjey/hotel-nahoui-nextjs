"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

type Room = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  roomType: { name: string } | null;
};

export function RoomsShowcaseSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ rooms: Room[] }>("/api/rooms");
        setRooms(data.rooms.slice(0, 8));
      } catch (err) {
        console.error("Erreur chargement chambres", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.8, 480);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Convertit le scroll vertical de la molette en scroll horizontal,
    // pour que la ligne se parcoure sans faire défiler la page.
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="mb-14 flex items-end justify-between gap-6">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="eyebrow text-primary"
            >
              Chambres & Suites
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance"
            >
              Des atmosphères pensées pour chaque séjour.
            </motion.h2>
          </div>

          {!loading && rooms.length > 0 && (
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Précédent"
                className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Suivant"
                className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-nowrap gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[60%] shrink-0 space-y-4 sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.9375rem)]">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollerRef}
            onWheel={handleWheel}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-hidden scroll-smooth pb-2"
          >
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.08 }}
                className="w-[60%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.9375rem)]"
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
                  <h3 className="font-display mt-2 text-2xl font-light">{room.name}</h3>
                  {room.shortDescription && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {room.shortDescription}
                    </p>
                  )}
                  <span className="link-underline mt-4 text-foreground text-[11px]">Découvrir</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link href="/stays" className="btn-fill-editorial">
            Voir toutes les chambres & suites
          </Link>
        </div>
      </div>
    </section>
  );
}
