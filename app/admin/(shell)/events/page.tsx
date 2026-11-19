"use client";

import { CrudManager, formatDate, formatXof, type FieldDef, type Item } from "@/components/admin/CrudManager";
import { SITE_LINK_OPTIONS } from "@/lib/site-links";

const fields: FieldDef[] = [
  { name: "title", label: "Nom de l'événement", type: "text", required: true, full: true },
  { name: "startDate", label: "Date de début", type: "date", required: true },
  { name: "endDate", label: "Date de fin", type: "date", help: "Laisser vide pour un événement d'un jour." },
  { name: "venue", label: "Lieu dans l'hôtel", type: "text", placeholder: "Bord de piscine, salle de réception…" },
  { name: "price", label: "Prix d'entrée (FCFA)", type: "number", help: "Laisser vide si gratuit / sur invitation." },
  { name: "summary", label: "Accroche", type: "textarea" },
  { name: "description", label: "Programme / description", type: "textarea" },
  { name: "imageUrl", label: "Affiche ou photo", type: "image" },
  { name: "ctaLabel", label: "Texte du bouton", type: "text", placeholder: "Réserver une table, Nous contacter…" },
  { name: "ctaUrl", label: "Lien du bouton", type: "link", options: SITE_LINK_OPTIONS, placeholder: "https://… ou /page", noneLabel: "Aucun bouton" },
  { name: "isPublished", label: "Publié sur le site", type: "boolean" },
  { name: "isFeatured", label: "Mis en avant sur l'accueil", type: "boolean" },
];

export default function EventsAdminPage() {
  return (
    <CrudManager
      resource="events"
      title="Événements"
      description="Soirées, concerts, brunchs, fêtes… affichés sur la page Événements."
      singular="Événement"
      fields={fields}
      defaults={{ isPublished: true }}
      summary={(e: Item) => {
        const past = new Date(String(e.endDate ?? e.startDate)) < new Date(new Date().toDateString());
        return {
          title: String(e.title),
          subtitle: [formatDate(e.startDate) + (e.endDate ? ` → ${formatDate(e.endDate)}` : ""), e.venue as string, e.price ? formatXof(e.price) : ""].filter(Boolean).join(" · "),
          image: (e.imageUrl as string) || null,
          badges: [
            e.isPublished ? { label: "Publié", tone: "primary" as const } : { label: "Brouillon", tone: "muted" as const },
            ...(e.isFeatured ? [{ label: "Accueil", tone: "default" as const }] : []),
            ...(past ? [{ label: "Passé", tone: "muted" as const }] : []),
          ],
        };
      }}
    />
  );
}
