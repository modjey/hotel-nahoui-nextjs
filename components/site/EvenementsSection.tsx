"use client";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Link from "next/link";

export function EvenementsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-10 py-12 lg:py-16">
      <div className="flex items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-xs uppercase tracking-[0.22em] text-primary">Littoral Ivoirien</span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-3 text-balance">
            CIRCUIT LA PETITE COTE : <span className="italic font-light">A LA DECOUVERTE DU LITTORAL (Sud)</span>
          </h2>
        </div>
        <Link href="/evenements" className="hidden sm:inline-block text-sm border-b border-foreground pb-1 hover:border-primary hover:text-primary transition-colors">
          Voir tous les circuits
        </Link>
      </div>

      <motion.a
        href="/evenements"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="group relative block overflow-hidden rounded-3xl aspect-[21/9] hover-lift"
      >
        <img
          src="https://hotelnahoui.net/wp-content/uploads/2024/06/20190116_104659.jpg"
          alt="Littoral ivoirien"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover img-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs uppercase tracking-[0.22em] opacity-80 mb-2">Découvrez le littoral (sud-ouest)</p>
          <h3 className="font-display text-3xl">6 Circuits touristiques</h3>
          <p className="text-lg opacity-90 mt-2">San Pedro, Grand Bereby, Roc Dougbalé, Cascade de la Dodo, Monogaga, Sassandra</p>
        </div>
      </motion.a>
    </section>
  );
}
