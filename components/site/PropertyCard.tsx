"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Property } from "@/data/properties";

export function PropertyCard({ p, index = 0 }: { p: Property; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
    >
      <Link href={`/stays/${p.id}`} className="group block">
        <div className="relative overflow-hidden aspect-[3/4] bg-muted">
          <img
            src={p.image}
            alt={p.title}
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover img-zoom"
          />
        </div>

        <div className="pt-5">
          <p className="eyebrow text-muted-foreground">
            {p.category}
            {p.roomNumber && ` · N° ${p.roomNumber}`}
          </p>
          <h3 className="font-display mt-2 text-2xl font-light leading-snug">
            {p.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-lg text-primary">{(p.price * 600).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">FCFA / nuit</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
