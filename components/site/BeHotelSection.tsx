"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    cta: "Voir les chambres",
    href: "/stays",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function BeHotelSection() {
  return (
    <section className="bg-warm">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <span className="eyebrow text-primary">Be Nahoui Balmer</span>
            <h2 className="section-title mt-5">Vivre la maison</h2>
          </div>
          <p className="max-w-md text-[1.0625rem] text-muted-foreground text-pretty">
            Une table, une piscine, des salles de réception et vingt-huit chambres :
            tout ce qu&rsquo;il faut pour un séjour d&rsquo;affaires ou en famille.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-14 lg:gap-x-10">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease, delay: (i % 2) * 0.1 }}
              className={`group ${i % 2 === 1 ? "sm:mt-20" : ""}`}
            >
              <Link href={card.href} className="block">
                <div className="relative overflow-hidden aspect-[680/440] bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.img}
                    alt=""
                    loading="lazy"
                    className="img-zoom absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="pt-6 lg:pt-7 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-8">
                  <h3 className="font-display text-[1.9rem] lg:text-[2.25rem] leading-[1.05]">{card.title}</h3>
                  <span className="hidden lg:grid h-11 w-11 place-items-center border border-foreground/25 transition-colors group-hover:bg-primary group-hover:border-primary group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <p className="text-[0.9875rem] leading-relaxed text-muted-foreground text-pretty lg:col-span-2 max-w-xl">{card.text}</p>
                  <span className="link-underline mt-2 w-fit text-brand-text">{card.cta}</span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
