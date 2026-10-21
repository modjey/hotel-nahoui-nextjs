"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, ArrowRight, ArrowUpRight } from "lucide-react";

const contactItems = [
  {
    icon: Phone,
    title: "Téléphone",
    lines: ["+225 27 34 71 22 33", "+225 07 88 49 49 79"],
    href: "tel:+2252734712233",
  },
  {
    icon: Mail,
    title: "E-mail",
    lines: ["reservations@nahouihotel.ci", "hotelnahoui@yahoo.com"],
    href: "mailto:reservations@nahouihotel.ci",
  },
  {
    icon: MapPin,
    title: "Adresse",
    lines: ["01 BP 1864 San-Pedro 01", "Côte d'Ivoire"],
    href: "/contact",
  },
  {
    icon: Clock,
    title: "Horaires",
    lines: ["Réception 24h/24", "Restaurant 6h – 23h"],
    href: "/contact",
  },
];

export function ContactSection() {
  return (
    <section className="border-t border-border bg-card py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10 grid gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow text-primary">Contact</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl leading-[1.04] text-balance">
            Une question, une envie de séjour ?
          </h2>
          <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
            Notre équipe vous répond pour vos réservations, événements et demandes sur-mesure,
            24h/24 à la réception.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-fill-editorial">
              Nous contacter
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/stays" className="btn-outline-editorial">
              Réserver un séjour
            </Link>
          </div>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-border">
          {contactItems.map((item, i) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
              className="border-r border-b border-border"
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col justify-between gap-8 p-6 lg:p-7 transition-colors hover:bg-primary hover:text-white"
              >
                <div className="flex items-start justify-between">
                  <item.icon className="h-6 w-6" />
                  <ArrowUpRight className="h-5 w-5 opacity-40 transition-opacity group-hover:opacity-100" />
                </div>
                <div>
                  <span className="font-display block text-xl leading-none">{item.title}</span>
                  {item.lines.map((line) => (
                    <span
                      key={line}
                      className="mt-1.5 block text-sm text-muted-foreground group-hover:text-white/85 break-all"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
