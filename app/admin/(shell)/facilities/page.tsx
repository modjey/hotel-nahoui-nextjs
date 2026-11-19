"use client";

import { CrudManager, type FieldDef, type Item } from "@/components/admin/CrudManager";

const CATEGORIES = [
  { value: "BIEN_ETRE", label: "Bien-être (piscine, jardin, salle de sport, spa)" },
  { value: "RESTAURANT", label: "Restaurant & bars (dont restaurant VIP)" },
  { value: "SEMINAIRE", label: "Salles de séminaire / réception" },
  { value: "LOISIRS", label: "Loisirs (espace enfants…)" },
];
const SHORT: Record<string, string> = { BIEN_ETRE: "Bien-être", RESTAURANT: "Restaurant", SEMINAIRE: "Séminaire", LOISIRS: "Loisirs" };

const fields: FieldDef[] = [
  { name: "name", label: "Nom de l'espace", type: "text", required: true, placeholder: "Piscine, Restaurant VIP, Salle Baobab…" },
  { name: "category", label: "Rubrique", type: "select", options: CATEGORIES, help: "Détermine la page du site où l'espace apparaît." },
  { name: "summary", label: "Accroche", type: "textarea" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "hours", label: "Horaires", type: "text", placeholder: "7h - 20h tous les jours" },
  { name: "capacity", label: "Capacité", type: "text", placeholder: "Jusqu'à 120 personnes en théâtre" },
  { name: "features", label: "Équipements / points forts", type: "tags", help: "Tapez un élément puis Entrée, ou cliquez une suggestion.", suggestions: ["Climatisation", "Wi-Fi gratuit", "Vidéoprojecteur", "Sonorisation", "Maître-nageur", "Transats", "Serviettes fournies", "Vestiaires", "Parking"] },
  { name: "coverImageUrl", label: "Photo principale", type: "image", folder: "facilities" },
  { name: "gallery", label: "Galerie photos", type: "gallery", folder: "facilities" },
  { name: "order", label: "Ordre d'affichage", type: "number" },
  { name: "isPublished", label: "Visible sur le site", type: "boolean" },
];

export default function FacilitiesAdminPage() {
  return (
    <CrudManager
      resource="facilities"
      title="Espaces de l'hôtel"
      description="Piscine, jardin, salle de sport, restaurant VIP, salles de séminaire… avec photos, horaires et équipements."
      singular="Espace"
      fields={fields}
      defaults={{ category: "BIEN_ETRE", isPublished: true, order: 0, features: [], gallery: [] }}
      intro="Tant qu'aucun espace n'est publié dans une rubrique, la page correspondante du site garde son contenu actuel."
      summary={(f: Item) => ({
        title: String(f.name),
        subtitle: [SHORT[String(f.category)], f.hours as string, f.capacity as string].filter(Boolean).join(" · "),
        meta: Array.isArray(f.gallery) && f.gallery.length ? `${f.gallery.length} photo(s) dans la galerie` : undefined,
        image: (f.coverImageUrl as string) || null,
        badges: [f.isPublished ? { label: "Visible", tone: "primary" as const } : { label: "Masqué", tone: "muted" as const }],
      })}
    />
  );
}
