import { getFacilities, getPublishedOffers } from '@/lib/public-content';
import type { Metadata } from "next";
import { ServicesPage } from '@/views/ServicesPage';

export const metadata: Metadata = {
  title: "Expériences et services",
  description:
    "Salle de conférence, espace jeux pour enfants, bar VIP et expériences sur-mesure : découvrez tous les services de l'Hôtel Nahoui Balmer.",
  alternates: { canonical: "/services" },
  openGraph: { url: "/services", title: "Expériences — Hôtel Nahoui Balmer" },
};


// Contenus gérés dans l'admin : rafraîchis au plus toutes les minutes.
export const revalidate = 60;

export default async function Page() {
  const [seminarRooms, seminarOffers] = await Promise.all([getFacilities("SEMINAIRE"), getPublishedOffers({ category: "SEMINAIRE" })]);
  return <ServicesPage seminarRooms={seminarRooms} seminarOffers={seminarOffers} />;
}
