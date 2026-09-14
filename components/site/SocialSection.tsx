"use client";
import { motion } from "framer-motion";
import { Facebook, Instagram } from "lucide-react";
import { TikTokIcon, WhatsAppIcon } from "@/components/site/social-icons";

const networks = [
  {
    name: "Instagram",
    handle: "@hotel_nahoui",
    href: "https://www.instagram.com/hotel_nahoui/",
    icon: Instagram,
    bg: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]",
  },
  {
    name: "Facebook",
    handle: "Hôtel Nahoui Balmer",
    href: "https://www.facebook.com/hotelnahouibalmer",
    icon: Facebook,
    bg: "bg-[#1877F2]",
  },
  {
    name: "TikTok",
    handle: "@nahouihotel",
    href: "https://www.tiktok.com/@nahouihotel?is_from_webapp=1&sender_device=pc",
    icon: TikTokIcon,
    bg: "bg-black",
  },
  {
    name: "WhatsApp",
    handle: "Nous écrire",
    href: "https://api.whatsapp.com/send?phone=%2B2250788494979",
    icon: WhatsAppIcon,
    bg: "bg-[#25D366]",
  },
];

export function SocialSection() {
  return (
    <section className="border-y border-border py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-primary"
        >
          Réseaux sociaux
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display mt-5 text-3xl sm:text-4xl font-light"
        >
          Restons connectés.
        </motion.h2>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {networks.map((network, i) => (
            <motion.a
              key={network.name}
              href={network.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="group flex w-32 flex-col items-center gap-4 text-foreground"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${network.bg}`}
              >
                <network.icon className="h-7 w-7" />
              </span>
              <span>
                <span className="eyebrow block transition-colors group-hover:text-primary">{network.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{network.handle}</span>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
