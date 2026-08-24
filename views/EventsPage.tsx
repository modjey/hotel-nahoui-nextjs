"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Anchor, Fish, Waves, Trees, Compass, Ship, Droplets } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export function EventsPage() {
  const circuits = [
    {
      icon: Anchor,
      title: "Circuit 1 · San Pedro",
      subtitle: "Site touristique San Pedro",
      activities: [
        "Visite port autonome + port de pêche",
        "City tour (colline des fleurs, village des pêcheurs)",
        "Visite rocher des amoureux",
        "Visite lac aux carpes koï et mini parc animalier",
      ],
      priceWithCar: "100 000 FCFA pour 2 personnes",
      priceWithoutCar: "25 000 FCFA pour 2 personnes",
      priceDetailsWithCar: "(voiture de location, activité, carburant, guide)",
      priceDetailsWithoutCar: "(activité, guide)",
    },
    {
      icon: Fish,
      title: "Circuit 2 · Grand Bereby",
      subtitle: "Grand Bereby",
      activities: [
        "Visite des singes de Nero-mer et civilités traditionnelles avec ambiance alloukou",
        "Visite du tunnel de la mangrove de Nero mer",
        "Visite des piscines naturelles de tabaoulé",
      ],
      priceWithCar: "130 000 FCFA pour 2 personnes",
      priceWithoutCar: "50 000 FCFA pour 2 personnes",
      priceDetailsWithCar: "(activité, voiture de location, carburant, guide)",
      priceDetailsWithoutCar: "si véhiculé",
    },
    {
      icon: Trees,
      title: "Circuit 3 · Roc Dougbalé",
      subtitle: "Roc Dougbalé",
      activities: [
        "Visite du village de roc dougbalé avec son enclos et œufs de tortues (selon la période)",
        "Randonnée pédestre de 2km pour visiter plantation de cacao",
        "Baignade et détente sur la plage",
      ],
      priceWithCar: "120 000 FCFA pour 2 personnes",
      priceWithoutCar: null,
      priceDetailsWithCar: "(activité, voiture de location, carburant, guide)",
      priceDetailsWithoutCar: null,
    },
    {
      icon: Waves,
      title: "Circuit 4 · Cascade de la Dodo",
      subtitle: "Cascade de la Dodo",
      activities: ["Visite du site, baignade, canoé kayak"],
      priceWithCar: "150 000 FCFA pour 2 personnes",
      priceWithoutCar: null,
      priceDetailsWithCar: "(activité, voiture de location, carburant, guide)",
      priceDetailsWithoutCar: null,
    },
    {
      icon: Compass,
      title: "Circuit 5 · Monogaga",
      subtitle: "Monogaga",
      activities: ["Découverte du lac Kanega", "Baignade et détente sur la plage"],
      priceWithCar: "125 000 FCFA pour 2 personnes",
      priceWithoutCar: null,
      priceDetailsWithCar: "(activité, voiture de location 4×4, carburant, guide)",
      priceDetailsWithoutCar: null,
    },
    {
      icon: Ship,
      title: "Circuit 6 · Sassandra",
      subtitle: "Sassandra",
      activities: [
        "Visite de la ville de Sassandra",
        "Visite du port de pêche et du monument des naufragés du bateau DUMANA",
        "Visite des singes sacrés",
      ],
      priceWithCar: "125 000 FCFA pour 2 personnes",
      priceWithoutCar: null,
      priceDetailsWithCar: "(activité, voiture de location, carburant, guide)",
      priceDetailsWithoutCar: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[440px] w-full overflow-hidden">
        <img
          src="https://hotelnahoui.net/wp-content/uploads/2024/06/20190116_104659.jpg"
          alt="Littoral ivoirien"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow"
          >
            Découvrez le littoral
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-light"
          >
            Littoral Ivoirien
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mt-6 max-w-lg text-sm sm:text-base text-white/85"
          >
            Circuit de la petite côte — à la découverte du littoral sud, entre plages, lagunes et villages de pêcheurs.
          </motion.p>
        </div>
      </section>

      {/* Circuits timeline */}
      <section className="mx-auto max-w-[900px] px-6 py-24 lg:py-32">
        <div className="text-center mb-16">
          <span className="eyebrow text-primary">Excursions</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light">Nos circuits</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Explorez le littoral ivoirien avec nos circuits guidés, personnalisés selon vos envies.
          </p>
        </div>

        <div>
          {circuits.map((circuit, index) => (
            <motion.div
              key={circuit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`py-12 ${index !== 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <circuit.icon className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-display text-2xl font-light">{circuit.title}</h3>
                  <p className="eyebrow text-muted-foreground mt-1">{circuit.subtitle}</p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground mb-6 pl-8">
                {circuit.activities.map((activity, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1">—</span>
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>

              <div className="pl-8 space-y-1 mb-6">
                <div className="font-display text-xl text-primary">{circuit.priceWithCar}</div>
                <div className="text-xs text-muted-foreground">{circuit.priceDetailsWithCar}</div>
                {circuit.priceWithoutCar && (
                  <>
                    <div className="font-display text-lg text-muted-foreground mt-2">{circuit.priceWithoutCar}</div>
                    <div className="text-xs text-muted-foreground">{circuit.priceDetailsWithoutCar}</div>
                  </>
                )}
              </div>

              <div className="pl-8">
                <Link href="/contact" className="link-underline text-foreground">
                  Réserver ce circuit
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white text-center py-20 lg:py-28">
        <MapPin className="h-6 w-6 mx-auto mb-6 text-white/70" />
        <span className="eyebrow text-white/70">Réservation</span>
        <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">
          Réservez votre circuit sur le littoral.
        </h2>
        <div className="mt-9">
          <Link href="/contact" className="link-underline text-white">
            Nous contacter
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
