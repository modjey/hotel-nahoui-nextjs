"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const links = [
  {
    img: "/assets/resto.png",
    title: "Expériences culinaires",
    subtitle: "Restaurant & Bar",
    href: "/restaurant",
  },
  {
    img: "/assets/spa.png",
    title: "Bien-être",
    subtitle: "Piscine & Spa",
    href: "/bien-etre",
  },
  {
    img: "/assets/service.png",
    title: "Offres et activités",
    subtitle: "Laissez-vous choyer",
    href: "/services",
  },
];

export function QuickLinksSection() {
  return (
    <section>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        {links.map((link, i) => (
          <motion.li
            key={link.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
          >
            <Link href={link.href} className="group relative block overflow-hidden aspect-[4/5] sm:aspect-[700/920] bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.img}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(26_12_9/0.85)] via-[rgb(26_12_9/0.15)] to-transparent" />
              {/* Cadre du monogramme qui apparaît au survol */}
              <div className="pointer-events-none absolute inset-3 border border-white/0 transition-colors duration-500 group-hover:border-white/80" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 lg:p-8 text-white">
                <div>
                  <span className="eyebrow text-white/85">{link.subtitle}</span>
                  <h3 className="font-display mt-2 text-3xl lg:text-[2.25rem] leading-[1.05]">{link.title}</h3>
                </div>
                <span className="h-11 w-11 shrink-0 grid place-items-center bg-primary transition-transform duration-500 group-hover:-translate-y-1">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
