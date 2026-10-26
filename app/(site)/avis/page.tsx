import type { Metadata } from "next";
import { ReviewsPage } from '@/views/ReviewsPage';

export const metadata: Metadata = {
  title: "Avis clients",
  description:
    "Découvrez les avis et témoignages de nos clients sur leur séjour à l'Hôtel Nahoui Balmer, à San Pedro, Côte d'Ivoire.",
  alternates: { canonical: "/avis" },
  openGraph: { url: "/avis", title: "Avis clients — Hôtel Nahoui Balmer" },
};

export default function Page() { return <ReviewsPage />; }
