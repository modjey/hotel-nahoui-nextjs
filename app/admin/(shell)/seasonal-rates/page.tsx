"use client";

import { CrudManager, formatDate, formatXof, type FieldDef, type Item } from "@/components/admin/CrudManager";

const fields: FieldDef[] = [
  { name: "name", label: "Nom de la période", type: "text", required: true, placeholder: "Fêtes de fin d'année, Haute saison…" },
  {
    name: "roomTypeId",
    label: "Type de chambre concerné",
    type: "select",
    optionsFrom: {
      url: "/api/admin/admin-room-types",
      key: "types",
      value: (t) => String(t.id),
      label: (t) => String(t.name),
      emptyLabel: "Toutes les chambres",
    },
  },
  { name: "startDate", label: "Du", type: "date", required: true },
  { name: "endDate", label: "Au (exclu)", type: "date", required: true, help: "Dernier jour non inclus, comme une date de départ." },
  { name: "price", label: "Prix fixe par nuit (FCFA)", type: "number", help: "Prix final : remplace le prix de base et la promo de la chambre. Laisser vide si vous utilisez un %." },
  { name: "percent", label: "Ou ajustement en %", type: "number", help: "Ex : 20 = +20 %, -10 = -10 %. Laisser vide si prix fixe." },
  { name: "minStay", label: "Séjour minimum (nuits)", type: "number", help: "Pour une arrivée pendant cette période." },
  { name: "isActive", label: "Active", type: "boolean" },
];

export default function SeasonalRatesAdminPage() {
  return (
    <CrudManager
      resource="seasonal-rates"
      title="Tarifs saisonniers"
      description="Augmentez ou baissez les prix sur une période et imposez un séjour minimum (haute saison, fêtes, événements)."
      singular="Tarif saisonnier"
      fields={fields}
      defaults={{ isActive: true, minStay: 1, roomTypeId: "all" }}
      intro="Le prix de chaque nuit est calculé selon la période où elle tombe. Si deux périodes se chevauchent, la plus récemment créée l'emporte. La promo (%) de la chambre s'applique ensuite, sauf sur un prix fixe (prix final)."
      summary={(r: Item) => {
        const type = r.roomType as { name?: string } | null;
        const pct = typeof r.percent === "number" ? `${r.percent > 0 ? "+" : ""}${r.percent} %` : "";
        return {
          title: String(r.name),
          subtitle: [`Du ${formatDate(r.startDate)} au ${formatDate(r.endDate)}`, type?.name ?? "Toutes les chambres"].join(" · "),
          meta: [r.price ? `${formatXof(r.price)} / nuit` : pct, Number(r.minStay) > 1 ? `minimum ${r.minStay} nuits` : ""].filter(Boolean).join(" · "),
          badges: [r.isActive ? { label: "Active", tone: "primary" as const } : { label: "Inactive", tone: "muted" as const }],
        };
      }}
    />
  );
}
