import type { Metadata } from "next";
import { ServicesPage } from '@/views/ServicesPage';

export const metadata: Metadata = {
  title: "Expériences et services",
  description:
    "Salle de conférence, espace jeux pour enfants, bar VIP et expériences sur-mesure : découvrez tous les services de l'Hôtel Nahoui Balmer.",
  alternates: { canonical: "/services" },
  openGraph: { url: "/services", title: "Expériences — Hôtel Nahoui Balmer" },
};

export default function Page() { return <ServicesPage />; }
