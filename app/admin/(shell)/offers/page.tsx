"use client";

import { CrudManager, formatDate, formatXof, type FieldDef, type Item } from "@/components/admin/CrudManager";
import { SITE_LINK_OPTIONS } from "@/lib/site-links";

const CATEGORIES = [
  { value: "SEJOUR", label: "Séjour / chambres" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "SEMINAIRE", label: "Séminaire" },
  { value: "EVENEMENT", label: "Événement" },
  { value: "BIEN_ETRE", label: "Bien-être" },
  { value: "AUTRE", label: "Autre" },
];

const fields: FieldDef[] = [
  { name: "title", label: "Titre de l'offre", type: "text", required: true, full: true },
  { name: "category", label: "Catégorie", type: "select", options: CATEGORIES },
  { name: "order", label: "Ordre d'affichage", type: "number", help: "Les plus petits nombres apparaissent en premier." },
  { name: "summary", label: "Accroche (courte)", type: "textarea", help: "1 à 2 phrases, affichées sur la carte de l'offre." },
  { name: "description", label: "Description détaillée", type: "textarea" },
  { name: "imageUrl", label: "Photo", type: "image" },
  { name: "price", label: "Prix indicatif (FCFA)", type: "number" },
  { name: "priceLabel", label: "Libellé du prix", type: "text", placeholder: "par nuit, par personne, à partir de…" },
  { name: "validFrom", label: "Valable du", type: "date" },
  { name: "validUntil", label: "Valable jusqu'au", type: "date", help: "Après cette date, l'offre disparaît automatiquement du site." },
  { name: "ctaLabel", label: "Texte du bouton", type: "text", placeholder: "Réserver, Demander un devis…" },
  { name: "ctaUrl", label: "Lien du bouton", type: "link", options: SITE_LINK_OPTIONS, placeholder: "https://… ou /page", noneLabel: "Par défaut (page Contact)" },
  { name: "isPublished", label: "Publiée sur le site", type: "boolean" },
  { name: "isFeatured", label: "Mise en avant sur l'accueil", type: "boolean" },
  { name: "isFlash", label: "Afficher en pop-up flash", type: "boolean", help: "S'ouvre sur tout le site, au plus une fois par 24 h pour chaque visiteur, pendant la période de validité." },
];

const label = (v: unknown) => CATEGORIES.find((c) => c.value === v)?.label ?? String(v);

export default function OffersAdminPage() {
  return (
    <CrudManager
      resource="offers"
      title="Offres & promotions"
      description="Offres commerciales publiées sur la page Offres et sur l'accueil."
      singular="Offre"
      fields={fields}
      defaults={{ category: "SEJOUR", isPublished: true, order: 0 }}
      intro="Pour une réduction sur une chambre précise, utilisez plutôt le champ « Promo (%) » de la fiche chambre : le prix barré s'affiche alors directement à la réservation."
      summary={(o: Item) => {
        const expired = o.validUntil && new Date(String(o.validUntil)) < new Date();
        return {
          title: String(o.title),
          subtitle: [label(o.category), o.price ? `${formatXof(o.price)} ${o.priceLabel ?? ""}`.trim() : ""].filter(Boolean).join(" · "),
          meta: o.validFrom || o.validUntil ? `Valable ${o.validFrom ? `du ${formatDate(o.validFrom)} ` : ""}${o.validUntil ? `au ${formatDate(o.validUntil)}` : ""}` : undefined,
          image: (o.imageUrl as string) || null,
          badges: [
            o.isPublished ? { label: "Publiée", tone: "primary" as const } : { label: "Brouillon", tone: "muted" as const },
            ...(o.isFeatured ? [{ label: "Accueil", tone: "default" as const }] : []),
            ...(o.isFlash ? [{ label: "Pop-up flash", tone: "default" as const }] : []),
            ...(expired ? [{ label: "Expirée", tone: "danger" as const }] : []),
          ],
        };
      }}
    />
  );
}
