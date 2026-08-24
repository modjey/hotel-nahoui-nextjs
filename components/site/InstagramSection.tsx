"use client";
import { motion } from "framer-motion";

const posts = [
  "/assets/hero.png",
  "/assets/resto.png",
  "/assets/spa.png",
  "/assets/conf.png",
  "/assets/env.png",
  "/assets/service.png",
];

export function InstagramSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="text-center mb-12">
          <span className="eyebrow text-primary">Suivez-nous</span>
          <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">
            @hotel_nahoui
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {posts.map((src, i) => (
            <motion.a
              key={src + i}
              href="https://www.instagram.com/hotel_nahoui/"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.06 }}
              className="group relative block aspect-square overflow-hidden"
            >
              <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover img-zoom" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
