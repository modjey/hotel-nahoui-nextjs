"use client";

import { CrudManager, formatDate, type FieldDef, type Item } from "@/components/admin/CrudManager";

const fields: FieldDef[] = [
  {
    name: "roomId",
    label: "Chambre",
    type: "select",
    required: true,
    full: true,
    optionsFrom: {
      url: "/api/admin/admin-rooms?limit=100",
      key: "rooms",
      value: (r) => String(r.id),
      label: (r) => (r.roomNumber ? `${r.name} (N° ${r.roomNumber})` : String(r.name)),
    },
  },
  { name: "startDate", label: "Fermée à partir du", type: "date", required: true },
  { name: "endDate", label: "Rouvre le", type: "date", required: true, help: "Jour de réouverture (la nuit précédente reste fermée)." },
  { name: "reason", label: "Motif (interne)", type: "text", full: true, placeholder: "Travaux, privatisation, usage interne…" },
];

export default function ClosuresAdminPage() {
  return (
    <CrudManager
      resource="closures"
      title="Fermetures de chambres"
      description="Bloquez une chambre sur une période : elle n'est plus réservable sur le site pendant ces dates."
      singular="Fermeture"
      fields={fields}
      intro="Les chambres déjà réservées sont bloquées automatiquement : inutile de les fermer ici. Utilisez cette page pour les travaux, une privatisation ou un blocage en haute saison."
      summary={(c: Item) => {
        const room = c.room as { name?: string; roomNumber?: string | null } | undefined;
        const ended = new Date(String(c.endDate)) <= new Date();
        return {
          title: room ? (room.roomNumber ? `${room.name} (N° ${room.roomNumber})` : String(room.name)) : "Chambre",
          subtitle: `Du ${formatDate(c.startDate)} au ${formatDate(c.endDate)}`,
          meta: (c.reason as string) || undefined,
          badges: [ended ? { label: "Terminée", tone: "muted" as const } : { label: "Active", tone: "danger" as const }],
        };
      }}
    />
  );
}
