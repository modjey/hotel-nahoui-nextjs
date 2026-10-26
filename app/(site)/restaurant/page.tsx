import type { Metadata } from "next";
import { RestaurantPage } from '@/views/RestaurantPage';

export const metadata: Metadata = {
  title: "Restaurant : cuisine ivoirienne à San Pedro",
  description:
    "Découvrez notre restaurant de cuisine ivoirienne, l'Aqua Bar au bord de la piscine et le Bar VIP de l'Hôtel Nahoui Balmer, à San Pedro.",
  alternates: { canonical: "/restaurant" },
  openGraph: { url: "/restaurant", title: "Restaurant — Hôtel Nahoui Balmer" },
};

export default function Page() { return <RestaurantPage />; }
