"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const cards = [
  {
    img: "/assets/resto.png",
    title: "Expérience culinaire",
    text: "Ambiance feutrée, cuisine raffinée et saveurs locales : du petit-déjeuner au dîner, notre table célèbre l'art de recevoir à l'ivoirienne.",
    cta: "Réserver une table",
    href: "/restaurant",
  },
  {
    img: "/assets/spa.png",
    title: "Bien-être & Détente",
    text: "Piscine extérieure, spa en chambre sur demande et espaces pensés pour le repos : chaque instant du séjour invite à ralentir.",
    cta: "En savoir plus",
    href: "/bien-etre",
  },
  {
    img: "/assets/conf.png",
    title: "Réunions et événements",
    text: "Pour vos moments d'exception, l'Hôtel Nahoui Balmer offre des espaces modulables et un savoir-recevoir attentionné, à San Pedro.",
    cta: "En savoir plus",
    href: "/evenements",
  },
  {
    img: "/assets/restoservice.png",
    title: "Chambres & Suites",
    text: "Chaque chambre et suite de l'Hôtel Nahoui Balmer est un univers à part, pensé pour savourer l'art de vivre ivoirien dans sa plus belle expression.",
    cta: "Plus d'informations",
    href: "/stays",
  },
];

export function BeHotelSection() {
  return (
    <section className="bg-warm">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-center text-primary"
        >
          Be Nahoui Balmer
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.1 }}
              className="group hover-lift overflow-hidden rounded-sm bg-white shadow-[var(--shadow-elevated)]"
            >
              <div className="relative overflow-hidden aspect-[680/430]">
                <img
                  src={card.img}
                  alt={card.title}
                  loading="lazy"
                  className="img-zoom absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-6 lg:p-8">
                <h3 className="font-display text-2xl lg:text-3xl font-light">{card.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">{card.text}</p>
                <Link href={card.href} className="link-underline mt-6 inline-flex text-foreground">
                  {card.cta}
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
