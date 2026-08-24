"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const offers = [
  {
    id: "piscine",
    img: "/assets/spa.png",
    kicker: "Détente",
    title: "Piscine & Bien-être",
    desc: "Une parenthèse au bord de l'eau, spa en chambre sur demande.",
  },
  {
    id: "conference",
    img: "/assets/conf.png",
    kicker: "Événementiel",
    title: "Réunions & Séminaires",
    desc: "Des espaces modulables pour vos rencontres professionnelles.",
  },
  {
    id: "experience",
    img: "/assets/restoservice.png",
    kicker: "Sur mesure",
    title: "Services & Attentions",
    desc: "Room service, navette et attentions personnalisées.",
  },
];

export function ServicesHighlightSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-primary"
        >
          Offres & Expériences
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance"
        >
          Tout le confort d&rsquo;une maison de caractère.
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-10">
        {offers.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
          >
            <Link href={`/services#${o.id}`} className="group block">
              <div className="relative overflow-hidden aspect-[3/4]">
                <img src={o.img} alt={o.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover img-zoom" />
              </div>
              <p className="eyebrow mt-5 text-muted-foreground">{o.kicker}</p>
              <h3 className="font-display mt-2 text-2xl font-light">{o.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{o.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link href="/services" className="btn-fill-editorial">
          Découvrir tous nos services
        </Link>
      </div>
    </section>
  );
}
