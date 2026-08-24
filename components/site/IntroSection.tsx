"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export function IntroSection() {
  return (
    <section className="mx-auto max-w-[860px] px-6 py-28 lg:py-40 text-center">
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="eyebrow text-primary"
      >
        Bienvenue
      </motion.span>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.05] text-balance"
      >
        Un art de recevoir, transmis depuis des générations.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="mt-8 text-base sm:text-lg leading-relaxed text-muted-foreground text-pretty"
      >
        Face à la mer, l&rsquo;Hôtel Nahoui Balmer réunit vingt-huit chambres et suites,
        une table où se mêlent tradition ivoirienne et raffinement, et une hospitalité
        pensée pour chaque instant du séjour.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="mt-10"
      >
        <Link href="/services" className="btn-fill-editorial">
          Découvrir la maison
        </Link>
      </motion.div>
    </section>
  );
}
