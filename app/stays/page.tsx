import { SuitesPage } from "@/views/SuitesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos Suites et Chambres - Hôtel Nahoui",
  description: "Découvrez nos hébergements de luxe en Côte d'Ivoire.",
};

export default function StaysPage() {
  return <SuitesPage />;
}
