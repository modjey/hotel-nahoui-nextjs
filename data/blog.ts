export type BlogCategory =
  | "Actualités"
  | "Événements"
  | "Gastronomie"
  | "Bien-être"
  | "Découverte"
  | "Offres";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  cover: string;
  category: BlogCategory;
  author: string;
  date: string; // ISO
  readingTime: number; // minutes
  tags: string[];
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "reouverture-de-la-piscine-panoramique",
    title: "Réouverture de notre piscine panoramique",
    excerpt:
      "Après plusieurs semaines de rénovation, notre piscine vue océan rouvre ses portes avec un nouveau pool bar et des transats premium.",
    content: [
      "Nous sommes heureux de vous annoncer la réouverture officielle de notre piscine panoramique, entièrement repensée pour offrir une expérience encore plus exceptionnelle à nos clients.",
      "Profitez désormais d'un tout nouveau pool bar, de transats haut de gamme et d'un service en bord de bassin disponible toute la journée. L'ambiance sonore a également été revue pour vous offrir une parenthèse de détente absolue face à l'océan.",
      "Pour célébrer cette réouverture, un cocktail signature vous sera offert sur présentation de votre clé de chambre durant tout le mois.",
    ],
    cover: "https://hotelnahoui.net/wp-content/uploads/2024/06/piscine-1.jpg",
    category: "Actualités",
    author: "Direction Hôtel Nahoui",
    date: "2026-05-10",
    readingTime: 3,
    tags: ["piscine", "rénovation", "détente"],
    featured: true,
  },
  {
    slug: "soiree-gastronomique-saveurs-ivoiriennes",
    title: "Soirée gastronomique : Saveurs ivoiriennes",
    excerpt:
      "Notre Chef vous invite à un voyage culinaire au cœur des traditions ivoiriennes, le dernier vendredi de chaque mois.",
    content: [
      "Chaque dernier vendredi du mois, notre restaurant se transforme en un véritable temple des saveurs locales. Le Chef et sa brigade revisitent les classiques de la cuisine ivoirienne avec une touche raffinée.",
      "Au menu : attiéké de la mer, kedjenou de poulet bicyclette, sauce graine, et bien d'autres surprises accompagnées d'une sélection de vins et cocktails locaux.",
      "Réservation conseillée. Animations live et ambiance alloukou garanties.",
    ],
    cover: "https://hotelnahoui.net/wp-content/uploads/2024/06/restaurant-1.jpg",
    category: "Gastronomie",
    author: "Chef Exécutif",
    date: "2026-05-02",
    readingTime: 4,
    tags: ["restaurant", "gastronomie", "soirée"],
    featured: true,
  },
  {
    slug: "nouveau-spa-et-rituels-bien-etre",
    title: "Nouveaux rituels bien-être au Spa Nahoui",
    excerpt:
      "Découvrez notre carte de soins enrichie : massages aux huiles essentielles, gommages au beurre de karité et rituels couple.",
    content: [
      "Notre Spa s'enrichit d'une nouvelle carte de soins inspirée des traditions ouest-africaines, alliant techniques ancestrales et expertise moderne.",
      "Au programme : massage relaxant à l'huile de coco, gommage au beurre de karité, soin du visage à l'argile, et un rituel couple de 90 minutes dans notre cabine duo.",
      "Une offre découverte de -15% est disponible sur tous les soins jusqu'à la fin du mois.",
    ],
    cover: "https://hotelnahoui.net/wp-content/uploads/2024/06/spa-1.jpg",
    category: "Bien-être",
    author: "Équipe Spa",
    date: "2026-04-22",
    readingTime: 3,
    tags: ["spa", "massage", "bien-être"],
  },
  {
    slug: "circuit-decouverte-grand-bereby",
    title: "À la découverte de Grand Bereby",
    excerpt:
      "Mangroves, piscines naturelles et singes de Nero-mer : embarquez pour une journée d'évasion à seulement 1h de l'hôtel.",
    content: [
      "Grand Bereby est une destination incontournable pour qui souhaite explorer la richesse naturelle du sud-ouest ivoirien.",
      "Notre circuit guidé vous emmène à la rencontre des singes sacrés de Nero-mer, dans le tunnel mystique de la mangrove, et jusqu'aux fameuses piscines naturelles de Tabaoulé.",
      "Réservez directement à la réception ou via notre page Circuits.",
    ],
    cover: "https://hotelnahoui.net/wp-content/uploads/2024/06/20190116_104659.jpg",
    category: "Découverte",
    author: "Service Conciergerie",
    date: "2026-04-12",
    readingTime: 5,
    tags: ["circuit", "nature", "excursion"],
  },
  {
    slug: "offre-speciale-sejour-romantique",
    title: "Offre spéciale : Séjour romantique 2 nuits",
    excerpt:
      "Suite vue mer, dîner aux chandelles et soin couple au spa : profitez de notre forfait amoureux à partir de 250 000 FCFA.",
    content: [
      "Pour les amoureux en quête d'une parenthèse hors du temps, nous proposons un forfait exclusif de 2 nuits comprenant l'hébergement en suite vue mer, un dîner gastronomique aux chandelles, et un rituel couple de 60 minutes au spa.",
      "Petits déjeuners en chambre, fleurs et bouteille de champagne incluses.",
      "Offre valable toute l'année, sous réserve de disponibilité.",
    ],
    cover: "https://hotelnahoui.net/wp-content/uploads/2024/06/chambre-1.jpg",
    category: "Offres",
    author: "Service Réservation",
    date: "2026-03-28",
    readingTime: 2,
    tags: ["offre", "couple", "séjour"],
  },
  {
    slug: "evenement-mariage-bord-de-mer",
    title: "Organisez votre mariage les pieds dans le sable",
    excerpt:
      "L'Hôtel Nahoui propose des prestations sur-mesure pour célébrer le plus beau jour de votre vie face à l'océan.",
    content: [
      "Notre équipe événementielle vous accompagne de A à Z pour organiser un mariage inoubliable : décoration florale, cérémonie laïque sur la plage, cocktail et dîner de gala.",
      "Capacité jusqu'à 200 invités, hébergement groupe disponible, et coordinateur dédié pour le jour J.",
      "Contactez-nous pour recevoir notre brochure mariage.",
    ],
    cover: "https://hotelnahoui.net/wp-content/uploads/2024/06/plage-1.jpg",
    category: "Événements",
    author: "Service Événementiel",
    date: "2026-03-15",
    readingTime: 4,
    tags: ["mariage", "événement", "plage"],
  },
];

export const blogCategories: BlogCategory[] = [
  "Actualités",
  "Événements",
  "Gastronomie",
  "Bien-être",
  "Découverte",
  "Offres",
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return [];
  return blogPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const aSame = a.category === current.category ? 1 : 0;
      const bSame = b.category === current.category ? 1 : 0;
      return bSame - aSame;
    })
    .slice(0, limit);
}
