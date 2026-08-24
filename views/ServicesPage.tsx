"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Presentation, Users, Mic, GlassWater, Car, Plane,
  UtensilsCrossed, Heart, PawPrint, Music, Sun, CheckCircle2, Layers, Calendar,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { EditorialSplit } from "@/components/site/EditorialSplit";

const quickLinks = [
  { id: "piscine", label: "Piscine" },
  { id: "bar", label: "Bar VIP" },
  { id: "sport", label: "Salle de sport" },
  { id: "conference", label: "Conférence" },
  { id: "evenements", label: "Événements" },
  { id: "jeux", label: "Espace jeux" },
  { id: "spa", label: "SPA" },
  { id: "experience", label: "Expérience" },
];

const gymEquipment = ["Tapis de course", "Vélos d'appartement", "Appareils de musculation", "Haltères et poids libres", "Bancs de musculation"];
const conferenceEquipment = ["Vidéoprojecteur & écran de projection", "Système de sonorisation", "Climatisation", "Tables et chaises modulables", "Connexion Wi-Fi haut débit"];

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

export function ServicesPage() {
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

      {/* Quick nav */}
      <div className="border-b border-border bg-background/95 sticky top-20 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 flex items-center gap-8 overflow-x-auto no-scrollbar py-5">
          {quickLinks.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="eyebrow text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0">
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div id="piscine" className="scroll-mt-32">
        <EditorialSplit
          eyebrow="Détente"
          title="Piscine"
          text="Notre piscine extérieure vous accueille tout au long de la journée pour une baignade rafraîchissante ou un moment de calme absolu, dans un cadre serein. Douche, maître-nageur et bassin pour enfants complètent cet espace."
          cta={{ label: "Réserver votre séjour", href: "/stays" }}
          image="/assets/Image14.jpg"
          imageAlt="Piscine de l'Hôtel Nahoui Balmer"
        />
      </div>

      <div id="bar" className="scroll-mt-32">
        <EditorialSplit
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
      <section className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
        <img src="/assets/cocktail.jpg" alt="Cocktails de l'Hôtel Nahoui Balmer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <GlassWater className="h-6 w-6 mb-5 text-white/80" />
          <span className="eyebrow">Focus cocktails</span>
          <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light max-w-lg">
            Grands classiques revisités, créations originales.
          </h2>
        </div>
      </section>

      <div id="sport" className="scroll-mt-32">
        <EditorialSplit
          eyebrow="Fitness"
          title="Salle de Sport"
          text="Équipée des derniers appareils cardiovasculaires et de musculation, notre salle vous offre un espace complet pour garder la forme, avec l'accompagnement d'un coach qualifié. Ouverte tous les jours de 9h à 19h."
          cta={{ label: "Découvrir", href: "/bien-etre" }}
          image="/assets/sport.jpg"
          imageAlt="Salle de sport de l'Hôtel Nahoui Balmer"
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 -mt-16 lg:-mt-24 pb-16 lg:pb-24">
        <div className="flex flex-wrap gap-x-10 gap-y-2 lg:pl-[calc(50%+4rem)]">
          {gymEquipment.map((e) => (
            <span key={e} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> {e}
            </span>
          ))}
        </div>
      </div>

      <div id="conference" className="scroll-mt-32">
        <EditorialSplit
          eyebrow="Événementiel"
          title="Salle de Conférence"
          text="Des espaces modulables entièrement équipés pour vos événements professionnels — réunions d'affaires, formations, ateliers ou présentations. Traiteur sur mesure disponible."
          cta={{ label: "Nous contacter", href: "/contact" }}
          image="/assets/conf.png"
          imageAlt="Salle de conférence de l'Hôtel Nahoui Balmer"
          reverse
        />
      </div>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 -mt-16 lg:-mt-24 pb-16 lg:pb-24">
        <div className="grid grid-cols-3 gap-8 max-w-md lg:ml-auto lg:pr-[calc(50%+4rem)] lg:mr-0">
          {[
            { icon: Users, v: "100", l: "Capacité max." },
            { icon: Layers, v: "Multi", l: "Salles disponibles" },
            { icon: Presentation, v: "100%", l: "Modulable" },
          ].map((s) => (
            <div key={s.l}>
              <s.icon className="h-5 w-5 text-primary mb-3" />
              <div className="font-display text-2xl font-light">{s.v}</div>
              <div className="eyebrow text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-2 lg:pr-[calc(50%+4rem)]">
          {conferenceEquipment.map((e) => (
            <span key={e} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mic className="h-3.5 w-3.5 text-primary shrink-0" /> {e}
            </span>
          ))}
        </div>
      </div>

      <div id="evenements" className="scroll-mt-32">
        <EditorialSplit
          eyebrow="Réceptions"
          title="Événements"
          text="Organisez vos réceptions, cocktails, anniversaires ou mariages dans un cadre élégant en plein air, autour de la piscine — jusqu'à 200 personnes. Service sur mesure et ambiance lumineuse."
          cta={{ label: "Nous contacter", href: "/contact" }}
          image="/assets/env.png"
          imageAlt="Événements de l'Hôtel Nahoui Balmer"
        />
      </div>

      <div id="jeux" className="scroll-mt-32">
        <EditorialSplit
          eyebrow="Pour les enfants"
          title="Espace Jeux"
          text="Sécurisé, ludique et coloré, notre espace de jeux invite les enfants à s'amuser en toute liberté. Les parents profitent de moments de tranquillité pendant que les petits vivent leurs aventures."
          cta={{ label: "En savoir plus", href: "/contact" }}
          image="/assets/espace-jeux.jpg"
          imageAlt="Espace jeux de l'Hôtel Nahoui Balmer"
          reverse
        />
      </div>

      <div id="spa" className="scroll-mt-32">
        <EditorialSplit
          eyebrow="Bien-être"
          title="SPA"
          text="Soins bien-être sur mesure, gestes experts et senteurs délicates — directement dans l'intimité de votre chambre. Une parenthèse sensorielle hors du temps pour apaiser le corps et l'esprit."
          cta={{ label: "Découvrir le bien-être", href: "/bien-etre" }}
          image="/assets/spa.png"
          imageAlt="SPA de l'Hôtel Nahoui Balmer"
        />
      </div>

      {/* Expérience Nahoui */}
      <section id="experience" className="scroll-mt-32 mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32 border-t border-border">
        <div className="text-center mb-16">
          <span className="eyebrow text-primary">Sur mesure</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light">L&rsquo;Expérience Nahoui</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Vivez bien plus qu&rsquo;un séjour — découvrez nos attentions particulières.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {clientExperiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.06 }}
            >
              <exp.icon className="h-6 w-6 text-primary mb-4" />
              <h3 className="font-display text-lg font-light">{exp.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{exp.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Circuits teaser */}
      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 pb-24 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center border-t border-border pt-16">
          <div>
            <span className="eyebrow text-primary">Excursions</span>
            <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Circuits & découverte du littoral</h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Six circuits guidés à la découverte de San Pedro, Grand Béréby, Sassandra et les plus beaux sites naturels du littoral ivoirien.
            </p>
            <div className="mt-8">
              <Link href="/evenements" className="link-underline text-foreground">
                Voir tous les circuits
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden">
            <img src="/assets/env.png" alt="Circuits sur le littoral ivoirien" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white text-center py-20 lg:py-28">
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
