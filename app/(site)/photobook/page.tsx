import type { Metadata } from "next";
import { PhotobookPage } from '@/views/PhotobookPage';

export const metadata: Metadata = {
  title: "Photobook",
  description:
    "Parcourez les plus belles photos de l'Hôtel Nahoui Balmer : chambres, piscine, restaurant et moments partagés par nos clients.",
  alternates: { canonical: "/photobook" },
  openGraph: { url: "/photobook", title: "Photobook — Hôtel Nahoui Balmer" },
};

export default function Page() { return <PhotobookPage />; }
