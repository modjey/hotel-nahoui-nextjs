"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export function BienEtreSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[5/6] overflow-hidden"
        >
          <img
            src="https://hotelnahoui.net/wp-content/uploads/2024/06/311479626_566194395305573_3980613546623940281_n.jpg"
            alt="Piscine Hôtel Nahoui"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </motion.div>

        <div>
          <span className="eyebrow text-primary">Expérience sur mesure</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light leading-[1.1] text-balance">
            Votre bien-être, notre priorité.
          </h2>
          <p className="mt-6 text-base text-muted-foreground max-w-md leading-relaxed text-pretty">
            Notre établissement hôtelier classé 3 étoiles vous offre un cadre idyllique et
            enchanteur pour tous types de séjours. Tout est conçu pour vous offrir une
            expérience sur mesure, dédiée à votre confort et à votre bien-être.
          </p>
          <div className="mt-9">
            <Link href="/bien-etre" className="link-underline text-foreground">
              Découvrir nos installations
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              { v: "3★", l: "Hôtel classé" },
              { v: "28", l: "Chambres" },
              { v: "Sur mesure", l: "Expérience" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-light">{s.v}</div>
                <div className="eyebrow text-muted-foreground mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
