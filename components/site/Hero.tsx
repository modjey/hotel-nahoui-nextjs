"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export type HeroContent = {
  heroVideoUrl: string;
  heroImageUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
};

/** Ouverture de l'accueil : textes, photo et vidéo modifiables dans Admin → Paramètres. */
export function Hero({ content }: { content: HeroContent }) {
  const heroPoster = content.heroImageUrl || "/assets/hero.png";
  // La vidéo n'est chargée que sur grand écran et bonne connexion : sur mobile, en
  // économie de données ou en 2G/3G, la photo suffit (évite plusieurs Mo au chargement).
  const [allowVideo, setAllowVideo] = useState(false);
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = Boolean(conn?.saveData) || /(^|-)(2g|3g)$/.test(conn?.effectiveType ?? "");
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Capacité du navigateur, connue seulement après montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllowVideo(wide && !slow && !calm);
  }, []);
  const heroVideo = allowVideo ? content.heroVideoUrl : "";
  // Le dernier mot du titre garde l'italique de la maquette (« Hôtel Nahoui *Balmer* »).
  const words = content.heroTitle.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words.pop() : null;
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0">
        {heroVideo ? (
          <video
            key={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            poster={heroPoster}
            className="h-full w-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPoster} alt="" className="h-full w-full object-cover" fetchPriority="high" />
        )}
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
          {content.heroEyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.2 }}
          className="font-display mt-5 text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[7.5rem] tracking-[-0.02em]"
        >
          {words.join(" ")}{lastWord && <> <em className="italic">{lastWord}</em></>}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.4 }}
          className="mt-5 max-w-xl text-base sm:text-lg text-white/90 text-pretty"
        >
          {content.heroSubtitle}
        </motion.p>
      </div>
    </section>
  );
}
