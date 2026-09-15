"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Presentation, Users, Mic, GlassWater, Car, Plane,
  UtensilsCrossed, Heart, PawPrint, Music, Sun, CheckCircle2, Layers, Calendar,
  Waves, Wine, Dumbbell, Gamepad2, PartyPopper, Compass,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

const quickLinks = [
  { id: "piscine", label: "Piscine", icon: Waves },
  { id: "bar", label: "Bar VIP", icon: Wine },
  { id: "sport", label: "Salle de sport", icon: Dumbbell },
  { id: "conference", label: "Conférence", icon: Presentation },
  { id: "evenements", label: "Événements", icon: PartyPopper },
  { id: "jeux", label: "Espace jeux", icon: Gamepad2 },
  { id: "spa", label: "SPA", icon: Sparkles },
  { id: "experience", label: "Expérience", icon: Compass },
];

const gymEquipment = ["Tapis de course", "Vélos d'appartement", "Appareils de musculation", "Haltères et poids libres", "Bancs de musculation"];
const conferenceEquipment = ["Vidéoprojecteur & écran", "Système de sonorisation", "Climatisation", "Tables & chaises modulables", "Wi-Fi haut débit"];
const conferenceStats = [
  { icon: Users, v: "100", l: "Capacité max." },
  { icon: Layers, v: "Multi", l: "Salles" },
  { icon: Presentation, v: "100%", l: "Modulable" },
];

const clientExperiences = [
  { icon: Sun, title: "Brunch", description: "Formule brunch savoureuse pour commencer la journée avec style." },
  { icon: Music, title: "Soirées", description: "Ambiances festives et soirées thématiques pour tous les goûts." },
  { icon: Heart, title: "Séjour romantique", description: "Décoration florale, champagne, accès SPA. Chambre nuptiale disponible." },
  { icon: Car, title: "Location voiture", description: "Véhicules disponibles à la réservation pour explorer la région." },
  { icon: Plane, title: "Navette aéroport", description: "Transfert confortable entre l'hôtel et l'aéroport, sur réservation." },
  { icon: UtensilsCrossed, title: "Room Service", description: "Restauration en chambre disponible pour vos repas et encas." },
  { icon: Sparkles, title: "SPA en chambre", description: "Massages et soins bien-être sur mesure dans l'intimité de votre chambre." },
  { icon: PawPrint, title: "Pet Friendly", description: "L'Hôtel Nahoui accueille vos compagnons à quatre pattes dans un cadre adapté." },
];

type ServiceBlockProps = {
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  image: string;
  imageAlt: string;
  reverse?: boolean;
  features?: string[];
  stats?: { icon: React.ElementType; v: string; l: string }[];
};

function ServiceBlock({ eyebrow, title, text, cta, image, imageAlt, reverse, features, stats }: ServiceBlockProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-6 lg:py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-sm bg-white shadow-[var(--shadow-elevated)]"
      >
        <div className={`relative h-64 sm:h-80 lg:h-auto overflow-hidden ${reverse ? "lg:order-2" : ""}`}>
          <img src={image} alt={imageAlt} loading="lazy" className="img-zoom absolute inset-0 h-full w-full object-cover" />
        </div>

        <div className="flex items-center p-8 sm:p-10 lg:p-14">
          <div className="max-w-lg">
            <span className="eyebrow text-primary">{eyebrow}</span>
            <h2 className="font-display mt-3 text-2xl sm:text-3xl lg:text-4xl font-light leading-[1.1]">{title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">{text}</p>

            {stats && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.l}>
                    <s.icon className="h-4 w-4 text-primary mb-2" />
                    <div className="font-display text-xl font-light">{s.v}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            )}

            {features && (
              <div className="mt-5 flex flex-wrap gap-2">
                {features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {f}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-7">
              <Link href={cta.href} className="btn-fill-editorial">
                {cta.label}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ServicesPage() {
  const [activeId, setActiveId] = useState(quickLinks[0].id);
  const isClickScrolling = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-160px 0px -65% 0px", threshold: 0 }
    );
    quickLinks.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    setActiveId(id);
    isClickScrolling.current = true;
    window.setTimeout(() => { isClickScrolling.current = false; }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        <img src="/assets/service.png" alt="Services de l'Hôtel Nahoui Balmer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="eyebrow">
            Expériences
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-light">
            Nos Services
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} className="mt-6 max-w-md text-sm sm:text-base text-white/85">
            Tout le confort d&rsquo;une maison de caractère, à chaque instant du séjour.
          </motion.p>
        </div>
      </section>

      {/* Quick nav — pill segmented control with sliding active indicator */}
      <div className="border-b border-border bg-background/95 sticky top-20 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-3.5">
          <div className="flex items-center justify-start lg:justify-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickLinks.map((l) => {
              const active = activeId === l.id;
              return (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={() => handleNavClick(l.id)}
                  className={`relative flex items-center gap-2 shrink-0 rounded-full px-4 py-2.5 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="services-nav-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <l.icon className="relative z-10 h-3.5 w-3.5" />
                  <span className="relative z-10">{l.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div id="piscine" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Détente"
          title="Piscine"
          text="Notre piscine extérieure vous accueille tout au long de la journée pour une baignade rafraîchissante ou un moment de calme absolu, dans un cadre serein. Douche, maître-nageur et bassin pour enfants complètent cet espace."
          cta={{ label: "Réserver votre séjour", href: "/stays" }}
          image="/assets/Image14.jpg"
          imageAlt="Piscine de l'Hôtel Nahoui Balmer"
        />
      </div>

      <div id="bar" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Vie nocturne"
          title="Bar VIP"
          text="Véritable lieu de vie, le Bar VIP accueille aussi bien les retrouvailles entre amis que les soirées festives. Musique, lumières tamisées et service soigné composent une atmosphère élégante."
          cta={{ label: "Découvrir", href: "/contact" }}
          image="/assets/restoservice.png"
          imageAlt="Bar VIP de l'Hôtel Nahoui Balmer"
          reverse
        />
      </div>

      {/* Cocktails banner */}
      <section className="relative h-[42vh] min-h-[300px] w-full overflow-hidden">
        <img src="/assets/cocktail.jpg" alt="Cocktails de l'Hôtel Nahoui Balmer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <GlassWater className="h-6 w-6 mb-4 text-white/80" />
          <span className="eyebrow">Focus cocktails</span>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl font-light max-w-lg">
            Grands classiques revisités, créations originales.
          </h2>
        </div>
      </section>

      <div id="sport" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Fitness"
          title="Salle de Sport"
          text="Équipée des derniers appareils cardiovasculaires et de musculation, notre salle vous offre un espace complet pour garder la forme, avec l'accompagnement d'un coach qualifié. Ouverte tous les jours de 9h à 19h."
          cta={{ label: "Découvrir", href: "/bien-etre" }}
          image="/assets/sport.jpg"
          imageAlt="Salle de sport de l'Hôtel Nahoui Balmer"
          features={gymEquipment}
        />
      </div>

      <div id="conference" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Événementiel"
          title="Salle de Conférence"
          text="Des espaces modulables entièrement équipés pour vos événements professionnels - réunions d'affaires, formations, ateliers ou présentations. Traiteur sur mesure disponible."
          cta={{ label: "Nous contacter", href: "/contact" }}
          image="/assets/conf.png"
          imageAlt="Salle de conférence de l'Hôtel Nahoui Balmer"
          reverse
          stats={conferenceStats}
          features={conferenceEquipment}
        />
      </div>

      <div id="evenements" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Réceptions"
          title="Événements"
          text="Organisez vos réceptions, cocktails, anniversaires ou mariages dans un cadre élégant en plein air, autour de la piscine - jusqu'à 200 personnes. Service sur mesure et ambiance lumineuse."
          cta={{ label: "Nous contacter", href: "/contact" }}
          image="/assets/env.png"
          imageAlt="Événements de l'Hôtel Nahoui Balmer"
        />
      </div>

      <div id="jeux" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Pour les enfants"
          title="Espace Jeux"
          text="Sécurisé, ludique et coloré, notre espace de jeux invite les enfants à s'amuser en toute liberté. Les parents profitent de moments de tranquillité pendant que les petits vivent leurs aventures."
          cta={{ label: "En savoir plus", href: "/contact" }}
          image="/assets/espace-jeux.jpg"
          imageAlt="Espace jeux de l'Hôtel Nahoui Balmer"
          reverse
        />
      </div>

      <div id="spa" className="scroll-mt-36">
        <ServiceBlock
          eyebrow="Bien-être"
          title="SPA"
          text="Soins bien-être sur mesure, gestes experts et senteurs délicates — directement dans l'intimité de votre chambre. Une parenthèse sensorielle hors du temps pour apaiser le corps et l'esprit."
          cta={{ label: "Découvrir le bien-être", href: "/bien-etre" }}
          image="/assets/spa.png"
          imageAlt="SPA de l'Hôtel Nahoui Balmer"
        />
      </div>

      {/* Expérience Nahoui */}
      <section id="experience" className="scroll-mt-36 mx-auto max-w-[1440px] px-6 lg:px-10 py-16 lg:py-20 border-t border-border">
        <div className="text-center mb-12">
          <span className="eyebrow text-primary">Sur mesure</span>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl font-light">L&rsquo;Expérience Nahoui</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Vivez bien plus qu&rsquo;un séjour — découvrez nos attentions particulières.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {clientExperiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.06 }}
              className="hover-lift rounded-sm bg-white shadow-[var(--shadow-card)] p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <exp.icon className="h-4 w-4" />
              </span>
              <h3 className="font-display text-lg font-light">{exp.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{exp.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Circuits teaser */}
      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-sm overflow-hidden bg-warm p-8 lg:p-0">
          <div className="lg:pl-14">
            <span className="eyebrow text-primary">Excursions</span>
            <h2 className="font-display mt-4 text-3xl sm:text-4xl font-light">Circuits & découverte du littoral</h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Six circuits guidés à la découverte de San Pedro, Grand Béréby, Sassandra et les plus beaux sites naturels du littoral ivoirien.
            </p>
            <div className="mt-7">
              <Link href="/evenements" className="link-underline text-foreground">
                Voir tous les circuits
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] lg:h-full overflow-hidden">
            <img src="/assets/env.png" alt="Circuits sur le littoral ivoirien" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white text-center py-16 lg:py-20">
        <span className="eyebrow text-white/70">Réservation</span>
        <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Profitez de nos services.</h2>
        <div className="mt-9">
          <Link href="/stays" className="link-underline text-white">
            <Calendar className="h-3.5 w-3.5" /> Réserver maintenant
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
