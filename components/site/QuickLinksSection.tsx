"use client";
import { motion } from "framer-motion";
import Link from "next/link";

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
    <section className="pb-1 lg:pb-1">
      <ul className="grid grid-cols-1 gap-px sm:grid-cols-3">
        {links.map((link, i) => (
          <motion.li
            key={link.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
          >
            <Link href={link.href} className="group relative block overflow-hidden aspect-[700/920]">
              <img
                src={link.img}
                alt={link.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-6 py-8 text-center text-white">
                <h3 className="font-display text-2xl font-light">{link.title}</h3>
                <span className="eyebrow mt-2 inline-block text-white/80">{link.subtitle}</span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
