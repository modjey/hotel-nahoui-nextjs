import type { Metadata } from "next";
import { EventsPage } from '@/views/EventsPage';

export const metadata: Metadata = {
  title: "Événements, réceptions et excursions",
  description:
    "Organisez vos réceptions, cocktails et mariages à l'Hôtel Nahoui Balmer, ou partez en excursion à la découverte de San Pedro et du littoral ivoirien.",
  alternates: { canonical: "/evenements" },
  openGraph: { url: "/evenements", title: "Événements — Hôtel Nahoui Balmer" },
};

export default function Page() { return <EventsPage />; }
