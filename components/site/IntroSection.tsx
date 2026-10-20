"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const facts = [
  { value: "28", label: "chambres et suites, de 23 à 80 m²" },
  { value: "10", label: "catégories, de la Standard à la Suite Présidentielle" },
  { value: "15h", label: "arrivée - départ avant 11h" },
  { value: "2016", label: "l'année où l'hotel a ouvert ses portes" },
];

export function IntroSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease }}
          className="lg:col-span-6"
        >
          <span className="eyebrow text-primary">Bienvenue</span>
          <h2 className="font-display mt-6 text-[2.25rem] sm:text-5xl leading-[1.06] text-balance">
            Un écrin d’élégance entre confort et sérénité
          </h2>
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty">
            Bienvenue à l’Hôtel Nahoui Balmer, une adresse d’exception où se conjuguent raffinement, confort et sens de l’hospitalité. Situé face à la mer, dans un environnement paisible et soigneusement préservé, notre établissement vous invite à vivre une expérience unique, placée sous le signe du bien-être et de la détente.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link href="/services" className="btn-fill-editorial">
              Découvrir notre hébergement
            </Link>
            <Link href="/stays" className="link-underline">
              Voir les chambres <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <dl className="lg:col-span-5 lg:col-start-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10 self-end">
          {facts.map((f, i) => (
            <motion.div
              key={f.value}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease, delay: 0.1 + i * 0.06 }}
              className="border-t border-border pt-5"
            >
              <dt className="font-display text-6xl lg:text-7xl leading-none text-primary tabular">{f.value}</dt>
              <dd className="mt-3 text-[0.9375rem] text-muted-foreground text-pretty">{f.label}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
