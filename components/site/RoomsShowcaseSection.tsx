"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="mb-14">
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.08 }}
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
