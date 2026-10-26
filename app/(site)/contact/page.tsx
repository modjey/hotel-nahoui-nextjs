import type { Metadata } from "next";
import { ContactPage } from '@/views/ContactPage';

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'Hôtel Nahoui Balmer à San Pedro : téléphone, e-mail, adresse et formulaire de contact pour vos réservations et demandes.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contact — Hôtel Nahoui Balmer" },
};

export default function Page() { return <ContactPage />; }
