"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export function EventsSection() {
  return (
    <section className="relative">
      <div className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="/assets/env.png"
          alt="Excursions sur le littoral ivoirien"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end pb-16 lg:pb-24 px-6 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow"
          >
            Excursions
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.1] text-balance max-w-2xl"
          >
            Le littoral ivoirien
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mt-6 max-w-md text-sm sm:text-base text-white/85 leading-relaxed"
          >
            Six circuits guidés à la découverte des plages, lagunes et villages de pêcheurs.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="mt-9"
          >
            <Link href="/evenements" className="link-underline text-white">
              En savoir plus
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
