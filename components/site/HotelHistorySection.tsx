"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export function HotelHistorySection() {
  return (
    <section className="relative">
      <div className="relative h-[70vh] min-h-[520px] w-full overflow-hidden">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="/assets/env.png"
          alt="Hôtel Nahoui Balmer, façade"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="mx-auto max-w-[900px] px-6 -mt-24 lg:-mt-32 relative z-10 pb-24 lg:pb-32 text-center">
        <div className="bg-background px-8 py-14 lg:px-20 lg:py-20 shadow-[var(--shadow-elevated)]">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow text-primary"
          >
            Une maison d&rsquo;exception
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display mt-4 text-6xl sm:text-7xl font-light"
          >
            Depuis 1998
          </motion.p>

          <div className="mx-auto mt-6 h-px w-16 bg-border" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="font-display mt-6 text-3xl sm:text-4xl font-light leading-[1.15] text-balance"
          >
            Une histoire, un lieu,<br className="hidden sm:block" /> une identité.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="mt-6 text-base leading-relaxed text-muted-foreground max-w-lg mx-auto text-pretty"
          >
            Née à San Pedro d&rsquo;une passion familiale pour l&rsquo;accueil, la maison
            Nahoui Balmer a grandi sans jamais perdre son caractère intime et son
            attachement à l&rsquo;excellence du service.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="mt-9"
          >
            <Link href="/services" className="link-underline text-foreground">
              Découvrir
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
