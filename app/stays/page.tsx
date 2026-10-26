import { SuitesPage } from "@/views/SuitesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chambres et suites",
  description:
    "Découvrez les 28 chambres et suites de l'Hôtel Nahoui Balmer à San Pedro : confort, vue jardin ou piscine, réservation en ligne en FCFA.",
  alternates: { canonical: "/stays" },
  openGraph: { url: "/stays", title: "Chambres et suites — Hôtel Nahoui Balmer" },
};

export default function StaysPage() {
  return <SuitesPage />;
}
