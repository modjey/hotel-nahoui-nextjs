import type { Metadata } from "next";
import { BienEtrePage } from '@/views/BienEtrePage';

export const metadata: Metadata = {
  title: "Bien-être : piscine, spa et salle de sport",
  description:
    "Détendez-vous à l'Hôtel Nahoui Balmer : piscine extérieure, spa avec soins en chambre et salle de sport équipée, à San Pedro.",
  alternates: { canonical: "/bien-etre" },
  openGraph: { url: "/bien-etre", title: "Bien-être — Hôtel Nahoui Balmer" },
};

export default function Page() { return <BienEtrePage />; }
