"use client";
import { motion } from "framer-motion";

const heroVideo = "/assets/banner.mp4";
const heroPoster = "/assets/hero.png";
const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink">
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
        <div className="absolute inset-0 photo-scrim" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 lg:px-10 pb-36 sm:pb-32 lg:pb-36 text-white">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.1 }}
          className="flex items-center gap-3 text-[0.9375rem] font-medium"
        >
          <span className="h-2.5 w-2.5 bg-primary outline outline-1 outline-offset-2 outline-white" />
          San Pedro, Côte d&rsquo;Ivoire - depuis 2016
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.2 }}
          className="font-display mt-5 text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[7.5rem] tracking-[-0.02em]"
        >
          Hôtel Nahoui <em className="italic">Balmer</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.4 }}
          className="mt-5 max-w-xl text-base sm:text-lg text-white/90 text-pretty"
        >
          Entre jardin tropical et océan Atlantique : 28 chambres et suites, piscine,
          spa, salle de sport, table ivoirienne, deux bars, salles de réception
          et espace jeux pour enfants.
        </motion.p>
      </div>
    </section>
  );
}
