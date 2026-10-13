"use client";
import { motion } from "framer-motion";
import { Instagram, ArrowUpRight } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/hotel_nahoui/";

const posts = [
  "/assets/hero.png",
  "/assets/resto.png",
  "/assets/spa.png",
  "/assets/conf.png",
  "/assets/env.png",
  "/assets/service.png",
  "/assets/cocktail.jpg",
  "/assets/restoservice.png",
  "/assets/espace-jeux.jpg",
];

export function InstagramSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4 flex flex-col justify-between gap-8">
          <div>
            <span className="eyebrow text-primary">Suivez-nous</span>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="section-title mt-5 block hover:text-brand-text transition-colors break-words"
            >
              @hotel_nahoui
            </a>
            <p className="mt-5 max-w-sm text-[1.0625rem] text-muted-foreground">
              Les coulisses de la maison, les plats du moment et la vie de l&rsquo;hôtel au quotidien.
            </p>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-editorial w-fit"
          >
            <Instagram className="h-4 w-4" /> Suivre sur Instagram
          </a>
        </div>

        <div className="lg:col-span-8 grid grid-cols-3 gap-1.5 sm:gap-2">
          {posts.map((src, i) => (
            <motion.a
              key={src + i}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Publication Instagram ${i + 1}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.06 }}
              className="group relative block aspect-square overflow-hidden bg-ink"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover img-zoom" />
              <span className="absolute inset-0 grid place-items-center bg-[rgb(224_0_20/0.0)] text-white opacity-0 transition-all duration-300 group-hover:bg-[rgb(224_0_20/0.55)] group-hover:opacity-100">
                <ArrowUpRight className="h-6 w-6" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
