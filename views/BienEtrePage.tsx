"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, Shield, Sparkles, Waves } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { EditorialSplit } from "@/components/site/EditorialSplit";

export function BienEtrePage() {
  const poolFeatures = ["Extérieure", "Traitement au chlore"];
  const poolAmenities = ["Douche", "Maître-nageur", "Bassin pour enfant"];

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative h-[65vh] min-h-[460px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixid=eyJhcHBfaWQiOjEyMDd9&ixlib=rb-1.2.1&q=80&w=1600"
          alt="Bien-être à l'Hôtel Nahoui Balmer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow"
          >
            Expérience sur mesure
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-light"
          >
            Bien-être
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mt-6 max-w-md text-sm sm:text-base text-white/85"
          >
            Détendez-vous et revitalisez le corps et l&rsquo;esprit.
          </motion.p>
        </div>
      </section>

      <EditorialSplit
        eyebrow="Piscine"
        title="Un moment de fraîcheur, à votre rythme."
        text="Notre piscine extérieure, ouverte toute la journée, invite à la détente seul ou entre proches. Douche, maître-nageur et bassin pour enfants complètent cet espace pensé pour le repos."
        cta={{ label: "Réserver votre séjour", href: "/stays" }}
        image="https://hotelnahoui.net/wp-content/uploads/2024/06/311479626_566194395305573_3980613546623940281_n.jpg"
        imageAlt="Piscine de l'Hôtel Nahoui Balmer"
      />

      <EditorialSplit
        eyebrow="Salle de sport"
        title="Maintenez votre rythme, même en voyage."
        text="Équipée des derniers appareils cardio et de musculation, notre salle de sport, accompagnée d'un coach qualifié, est ouverte tous les jours de 9h à 19h."
        cta={{ label: "Réserver votre séjour", href: "/stays" }}
        image="https://hotelnahoui.net/wp-content/uploads/2024/07/images-4.jpeg"
        imageAlt="Salle de sport de l'Hôtel Nahoui Balmer"
        reverse
      />

      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 pb-24 lg:pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 border-t border-border pt-16">
          {[
            { icon: Waves, title: "Profondeur", desc: "De 0 à 2 mètres" },
            { icon: Shield, title: "Sécurité", desc: "Maître-nageur & premiers secours" },
            { icon: Clock, title: "Horaires", desc: "Salle de sport 9h – 19h, tous les jours" },
          ].map((item) => (
            <div key={item.title} className="text-center sm:text-left">
              <item.icon className="h-6 w-6 text-primary mb-4 mx-auto sm:mx-0" />
              <h3 className="font-display text-xl font-light">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center sm:text-left">
          <p className="eyebrow text-muted-foreground mb-2">Autres commodités</p>
          <p className="text-sm text-muted-foreground max-w-xl">
            {[...poolFeatures, ...poolAmenities].join(" · ")}
          </p>
        </div>
      </section>

      <section className="bg-ink text-white text-center py-20 lg:py-28">
        <span className="eyebrow text-white/70">Nos installations</span>
        <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">
          Profitez de nos espaces bien-être.
        </h2>
        <div className="mt-9">
          <Link href="/stays" className="link-underline text-white">
            <Sparkles className="h-3.5 w-3.5" /> Réserver maintenant
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
