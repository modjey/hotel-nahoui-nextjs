"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const heroVideo = "/assets/banner.mp4";
const heroPoster = "/assets/hero.png";

export function Hero() {
  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster}
          className="h-full w-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow"
        >
          Une maison d&rsquo;exception
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="font-display mt-6 text-[42px] leading-[1.05] sm:text-6xl lg:text-[84px] font-light"
        >
          Hôtel Nahoui Balmer
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-6 max-w-md text-sm sm:text-base font-light text-white/85"
        >
          L&rsquo;élégance et l&rsquo;hospitalité au cœur de San Pedro.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
          className="mt-10"
        >
          <Link href="/stays" className="link-underline text-white">
            Découvrir
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute inset-x-0 bottom-8 z-10 flex justify-center text-white/80"
      >
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </motion.div>
    </section>
  );
}
