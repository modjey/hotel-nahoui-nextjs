const p1 = "/assets/property-1.jpg";
const p2 = "/assets/property-2.jpg";
const p3 = "/assets/property-3.jpg";
const p4 = "/assets/property-4.jpg";
const d1 = "/assets/dest-1.jpg";
const d2 = "/assets/dest-2.jpg";
const d3 = "/assets/dest-3.jpg";

export interface Property {
  id: string;
  title: string;
  roomNumber?: string;
  location: string;
  country: string;
  image: string;
  gallery: string[];
  price: number;
  rating: number;
  reviews: number;
  nights: number;
  beds: number;
  baths: number;
  guests: number;
  category: string;
  tag?: string;
  host: { name: string; since: string; superhost: boolean };
  description: string;
  amenities: string[];
  coords: { lat: number; lng: number };
}

export const properties: Property[] = [
  {
    id: "villa-assinie",
    title: "Villa Assinie",
    location: "Assinie-Mafia",
    country: "Côte d'Ivoire",
    image: p1,
    gallery: [p1, d3, p2, p4, p3],
    price: 482, rating: 4.97, reviews: 218, nights: 5, beds: 3, baths: 2, guests: 6,
    category: "Bord de mer", tag: "Choix de l'éditeur",
    host: { name: "Kouamé", since: "2019", superhost: true },
    description:
      "Une villa de luxe face à l'océan Atlantique avec plage privée. Piscine à débordement, terrasse panoramique et cuisine ivoirienne traditionnelle sur demande.",
    amenities: ["Piscine à débordement", "Plage privée", "Cuisine équipée", "Wi-Fi rapide", "Climatisation", "Barbecue"],
    coords: { lat: 5.1344, lng: -3.3422 },
  },
  {
    id: "residence-bingerville",
    title: "Résidence Bingerville",
    location: "Bingerville",
    country: "Côte d'Ivoire",
    image: p2,
    gallery: [p2, d2, p4, p1, p3],
    price: 612, rating: 4.94, reviews: 174, nights: 7, beds: 4, baths: 3, guests: 8,
    category: "Lofts urbains",
    host: { name: "Yao", since: "2017", superhost: true },
    description:
      "Villa moderne en bordure de lagune avec vue sur Abidjan. Jardin tropical, piscine et espace de détente parfait pour les familles.",
    amenities: ["Piscine", "Vue sur lagune", "Jardin tropical", "Climatisation", "Parking sécurisé", "Vélos"],
    coords: { lat: 5.3517, lng: -3.8767 },
  },
  {
    id: "chalet-tai",
    title: "Chalet Taï",
    location: "Parc National de Taï",
    country: "Côte d'Ivoire",
    image: p3,
    gallery: [p3, d1, p1, p4, p2],
    price: 388, rating: 4.91, reviews: 96, nights: 4, beds: 2, baths: 1, guests: 4,
    category: "Montagne", tag: "Trouvaille rare",
    host: { name: "Konan", since: "2020", superhost: true },
    description:
      "Éco-lodge au cœur de la forêt primaire de Taï. Observation de la faune, randonnées guidées et immersion dans la nature ivoirienne.",
    amenities: ["Vue sur forêt", "Guides nature", "Plancher chauffant", "Balades en forêt", "Baignoire naturelle", "Climatisation"],
    coords: { lat: 5.7533, lng: -7.3483 },
  },
  {
    id: "hotel-yamoussoukro",
    title: "Hôtel Yamoussoukro",
    location: "Yamoussoukro",
    country: "Côte d'Ivoire",
    image: p4,
    gallery: [p4, d2, p2, p1, p3],
    price: 545, rating: 4.96, reviews: 142, nights: 3, beds: 3, baths: 2, guests: 6,
    category: "Riads",
    host: { name: "Awa", since: "2021", superhost: false },
    description:
      "Hôtel de charme au cœur de la capitale politique. Architecture moderne, piscine et proche de la Basilique Notre-Dame de la Paix.",
    amenities: ["Piscine chauffée", "Douche extérieure", "Coin feu", "Restaurant", "Climatisation", "Terrasse"],
    coords: { lat: 6.8275, lng: -5.2892 },
  },
  {
    id: "loft-cocody",
    title: "Loft Cocody",
    location: "Cocody, Abidjan",
    country: "Côte d'Ivoire",
    image: p2,
    gallery: [p2, p1, d2, p4, p3],
    price: 298, rating: 4.89, reviews: 311, nights: 6, beds: 2, baths: 2, guests: 4,
    category: "Lofts urbains",
    host: { name: "Koffi", since: "2018", superhost: true },
    description:
      "Appartement loft moderne dans le quartier chic de Cocody. Vue sur la ville, proche des restaurants et commerces, idéal pour les voyages d'affaires.",
    amenities: ["Terrasse sur le toit", "Bar espresso", "Espace de travail", "Climatisation", "Lecteur vinyle", "Vélo"],
    coords: { lat: 5.3517, lng: -4.0123 },
  },
  {
    id: "lac-kossou",
    title: "Villa Lac Kossou",
    location: "Lac Kossou",
    country: "Côte d'Ivoire",
    image: p1,
    gallery: [p1, p3, d3, p4, p2],
    price: 720, rating: 5.0, reviews: 41, nights: 5, beds: 2, baths: 2, guests: 4,
    category: "Bord de lac", tag: "Nouveau",
    host: { name: "Adjoua", since: "2024", superhost: false },
    description:
      "Villa au bord du lac avec vue panoramique. Cheminée, baignoire fenêtrée et petit-déjeuner inclus. Parfait pour une escapade romantique.",
    amenities: ["Vue sur le lac", "Baignoire", "Cheminee", "Petit-déjeuner quotidien", "Balades en bateau", "Plancher chauffant"],
    coords: { lat: 6.9333, lng: -5.0833 },
  },
  {
    id: "villa-grand-bassam",
    title: "Maison Grand-Bassam",
    location: "Grand-Bassam",
    country: "Côte d'Ivoire",
    image: p4,
    gallery: [p4, p2, d2, p1, p3],
    price: 410, rating: 4.92, reviews: 188, nights: 4, beds: 3, baths: 2, guests: 6,
    category: "Isolé",
    host: { name: "Amani", since: "2016", superhost: true },
    description:
      "Maison coloniale restaurée à Grand-Bassam, classée au patrimoine UNESCO. Terrasse ombragée, jardin tropical et vue sur l'océan.",
    amenities: ["Jardin tropical", "Cuisine d'été", "Piscine", "Terrain de pétanque", "Cave à vin", "Navette vers la plage"],
    coords: { lat: 5.1167, lng: -3.25 },
  },
  {
    id: "campagne-korhogo",
    title: "Domaine Korhogo",
    location: "Korhogo",
    country: "Côte d'Ivoire",
    image: p3,
    gallery: [p3, d1, p2, p4, p1],
    price: 366, rating: 4.88, reviews: 122, nights: 5, beds: 2, baths: 1, guests: 3,
    category: "Campagne",
    host: { name: "Sékou", since: "2019", superhost: true },
    description:
      "Domaine rural au nord de la Côte d'Ivoire. Découverte de la culture sénoufo, tissage traditionnel et immersion dans la vie locale.",
    amenities: ["Vue sur campagne", "Atelier tissage", "Cuisine traditionnelle", "Visites guidées", "Douche extérieure", "Bibliothèque"],
    coords: { lat: 9.4556, lng: -5.6333 },
  },
];

export const getProperty = (id: string) => properties.find((p) => p.id === id);
