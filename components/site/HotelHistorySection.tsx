"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  "/uploads/rooms/Image3.jpg",
  "/uploads/rooms/Image4.jpg",
  "/uploads/rooms/Image6.jpg",
  "/uploads/rooms/Image7.jpg",
  "/uploads/rooms/Image8.jpg",
];

const SLIDE_DURATION = 5500;
const ease = [0.22, 1, 0.36, 1] as const;

function HistorySlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [index]);

  return (
    <div className="relative h-[62vh] min-h-[460px] lg:h-[78vh] lg:min-h-[560px] w-full overflow-hidden bg-ink">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.4, ease },
            scale: { duration: SLIDE_DURATION / 1000 + 1.4, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[index]}
            alt="Hôtel Nahoui Balmer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-[rgb(26_12_9/0.45)] via-transparent to-transparent pointer-events-none" />

      {/* Indicateurs */}
      <div className="absolute top-6 right-5 lg:right-10 z-10 flex items-center gap-4 text-white">
        <span className="text-sm font-semibold tabular">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Afficher l'image ${i + 1}`}
              aria-current={i === index}
              className="relative h-[3px] w-7 overflow-hidden bg-white/35 before:absolute before:-inset-3 before:content-['']"
            >
              {i === index && (
                <motion.span
                  key={index}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                  className="absolute inset-0 origin-left bg-white"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HotelHistorySection() {
  return (
    <section className="relative pt-1">
      <HistorySlideshow />

      <div className="mx-auto max-w-[1440px] px-5 lg:px-10 -mt-28 lg:-mt-40 relative z-10 pb-24 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease }}
          className="bg-card max-w-[980px] grid gap-8 p-8 sm:p-12 lg:p-16 md:grid-cols-[auto_1fr] md:gap-14 border border-border"
        >
          <div className="md:border-r md:border-border md:pr-14">
            <span className="eyebrow text-primary">Un hébergement d&rsquo;exception</span>
            <p className="font-display mt-5 leading-[0.9] text-primary">
              <span className="block text-2xl italic text-foreground">Depuis</span>
              <span className="block text-7xl sm:text-8xl tabular">2016</span>
            </p>
          </div>

          <div className="flex flex-col justify-end">
            <h2 className="font-display text-3xl sm:text-[2.6rem] leading-[1.08] text-balance">
              Une histoire, un lieu, une identité.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty">
              Née à San Pedro d&rsquo;une passion familiale pour l&rsquo;accueil, Hotel Nahoui a grandi sans jamais perdre son caractère intime et son
              attachement à l&rsquo;excellence du service.
            </p>
            <div className="mt-8">
              <Link href="/services" className="link-underline">
                Découvrir notre histoire <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
