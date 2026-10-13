"use client";
import { motion } from "framer-motion";
import { Facebook, Instagram, ArrowUpRight } from "lucide-react";
import { TikTokIcon, WhatsAppIcon } from "@/components/site/social-icons";

const networks = [
  { name: "Instagram", handle: "@hotel_nahoui", href: "https://www.instagram.com/hotel_nahoui/", icon: Instagram },
  { name: "Facebook", handle: "Hôtel Nahoui Balmer", href: "https://www.facebook.com/hotelnahouibalmer", icon: Facebook },
  { name: "TikTok", handle: "@nahouihotel", href: "https://www.tiktok.com/@nahouihotel?is_from_webapp=1&sender_device=pc", icon: TikTokIcon },
  { name: "WhatsApp", handle: "Nous écrire", href: "https://api.whatsapp.com/send?phone=%2B2250788494979", icon: WhatsAppIcon },
];

export function SocialSection() {
  return (
    <section className="border-t border-border bg-card py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow text-primary">Réseaux sociaux</span>
            <h2 className="font-display mt-5 text-4xl sm:text-5xl leading-none">Restons connectés.</h2>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-2 lg:grid-cols-4 border-t border-l border-border">
          {networks.map((network, i) => (
            <motion.li
              key={network.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
              className="border-r border-b border-border"
            >
              <a
                href={network.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col justify-between gap-10 p-6 lg:p-8 transition-colors hover:bg-primary hover:text-white"
              >
                <div className="flex items-start justify-between">
                  <network.icon className="h-7 w-7" />
                  <ArrowUpRight className="h-5 w-5 opacity-40 transition-opacity group-hover:opacity-100" />
                </div>
                <div>
                  <span className="font-display block text-2xl lg:text-[1.75rem] leading-none">{network.name}</span>
                  <span className="mt-2 block text-sm text-muted-foreground group-hover:text-white/85 truncate">{network.handle}</span>
                </div>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
