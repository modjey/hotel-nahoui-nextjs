"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

type Room = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  sizeSqm: number | null;
  maxGuests?: number | null;
  basePrice?: number | null;
  currency?: string | null;
  coverImageUrl: string | null;
  roomType: { name: string } | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value).replace(/ | /g, " ");
}

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

  return (
    <section className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="mb-12 lg:mb-14 flex items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease }}
          >
            <span className="eyebrow text-primary">Chambres &amp; Suites</span>
            <h2 className="section-title mt-5 max-w-3xl">
              Des atmosphères pensées pour chaque séjour.
            </h2>
          </motion.div>

          {!loading && rooms.length > 0 && (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Chambres précédentes"
                className="flex h-12 w-12 items-center justify-center border border-border transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Chambres suivantes"
                className="flex h-12 w-12 items-center justify-center bg-primary text-white transition-colors hover:bg-brand-deep"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-nowrap gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[78%] shrink-0 space-y-4 sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <Skeleton className="h-6 w-2/3 rounded-none" />
                <Skeleton className="h-4 w-1/2 rounded-none" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="no-scrollbar -mx-5 px-5 lg:mx-0 lg:px-0 flex gap-6 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory"
          >
            {rooms.map((room, i) => (
              <motion.article
                key={`${room.id}-${i}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease, delay: (i % 4) * 0.06 }}
                className="w-[78%] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
              >
                <Link href={`/rooms/${room.slug}`} className="group block">
                  <div className="relative overflow-hidden aspect-[4/5] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={room.coverImageUrl || "/assets/hero.png"}
                      alt={room.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover img-zoom"
                    />
                    {room.basePrice ? (
                      <span className="price-stamp absolute left-4 bottom-4">
                        <small>dès</small>
                        <strong>
                          {formatPrice(room.basePrice)} {room.currency === "XOF" || !room.currency ? "F" : room.currency}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                  <p className="eyebrow mt-5 text-muted-foreground">
                    {room.roomType?.name || "Chambre"}
                  </p>
                  <h3 className="font-display mt-1.5 text-[1.75rem] leading-tight">{room.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[
                      room.sizeSqm ? `${room.sizeSqm} m²` : null,
                      room.maxGuests ? `${room.maxGuests} pers.` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {room.shortDescription ? (
                      <span className="block mt-1 line-clamp-2">{room.shortDescription}</span>
                    ) : null}
                  </p>
                  <span className="link-underline mt-4 text-brand-text">
                    Voir la chambre <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">Tarifs indicatifs par nuit, en FCFA.</p>
          <Link href="/stays" className="btn-fill-editorial">
            Voir toutes les chambres &amp; suites
          </Link>
        </div>
      </div>
    </section>
  );
}
