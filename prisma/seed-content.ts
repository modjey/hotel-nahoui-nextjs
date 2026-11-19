/**
 * Contenus de départ pour Admin → Espaces : reprend la présentation actuelle de la page
 * Bien-être (piscine, salle de sport, spa) pour qu'elle devienne modifiable.
 * Idempotent : un espace déjà présent (même slug) n'est pas modifié.
 *
 *   npm run db:seed-content
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const facilities = [
  {
    slug: "piscine",
    name: "Piscine",
    category: "BIEN_ETRE" as const,
    summary: "Un moment de fraîcheur, à votre rythme.",
    description:
      "Notre piscine extérieure, ouverte toute la journée, invite à la détente seul ou entre proches. Douche, maître-nageur et bassin pour enfants complètent cet espace pensé pour le repos.",
    features: ["Extérieure", "Profondeur de 0 à 2 m", "Maître-nageur", "Bassin pour enfants", "Douche"],
    coverImageUrl: "https://hotelnahoui.net/wp-content/uploads/2024/06/311479626_566194395305573_3980613546623940281_n.jpg",
    order: 1,
  },
  {
    slug: "salle-de-sport",
    name: "Salle de sport",
    category: "BIEN_ETRE" as const,
    summary: "Maintenez votre rythme, même en voyage.",
    description:
      "Équipée des derniers appareils cardio et de musculation, notre salle de sport est accompagnée d'un coach qualifié.",
    hours: "9h - 19h, tous les jours",
    features: ["Cardio", "Musculation", "Coach qualifié"],
    coverImageUrl: "/assets/sport.jpg",
    order: 2,
  },
  {
    slug: "spa",
    name: "SPA",
    category: "BIEN_ETRE" as const,
    summary: "Une parenthèse sensorielle, hors du temps.",
    description:
      "Soins bien-être sur mesure et gestes experts, directement dans l'intimité de votre chambre : massages relaxants, soins du visage et rituels sur-mesure pour apaiser le corps et l'esprit.",
    features: ["Massages", "Soins du visage", "Soins en chambre"],
    coverImageUrl: "/assets/spa.png",
    order: 3,
  },
];

async function main() {
  for (const f of facilities) {
    const existing = await prisma.facility.findUnique({ where: { slug: f.slug } });
    if (existing) {
      console.log(`= ${f.name} existe déjà`);
      continue;
    }
    await prisma.facility.create({ data: { ...f, gallery: [], isPublished: true } });
    console.log(`+ ${f.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
