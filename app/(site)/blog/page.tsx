import type { Metadata } from "next";
import { BlogPage } from '@/views/BlogPage';

export const metadata: Metadata = {
  title: "Actualité",
  description:
    "Toute l'actualité de l'Hôtel Nahoui Balmer : nouveautés, événements, gastronomie et vie de l'hôtel à San Pedro.",
  alternates: { canonical: "/blog" },
  openGraph: { url: "/blog", title: "Actualité — Hôtel Nahoui Balmer", type: "website" },
};

export default function Page() { return <BlogPage />; }
