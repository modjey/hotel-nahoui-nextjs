"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Send, Loader2 } from "lucide-react";
import { CrudManager, formatDate, formatXof, type FieldDef, type Item } from "@/components/admin/CrudManager";
import { whatsappHref } from "@/components/admin/BookingContactPanel";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";

const TYPES = [
  { value: "GROUPE", label: "Séjour de groupe" },
  { value: "SEMINAIRE", label: "Séminaire" },
  { value: "EVENEMENT", label: "Événement" },
];
const STATUSES = [
  { value: "NEW", label: "Nouvelle" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "SENT", label: "Devis envoyé" },
  { value: "WON", label: "Acceptée" },
  { value: "LOST", label: "Sans suite" },
];
const lbl = (list: { value: string; label: string }[], v: unknown) => list.find((x) => x.value === v)?.label ?? String(v);

const fields: FieldDef[] = [
  { name: "type", label: "Type", type: "select", options: TYPES },
  { name: "status", label: "Statut", type: "select", options: STATUSES },
  { name: "contactName", label: "Contact", type: "text", required: true },
  { name: "companyName", label: "Entreprise", type: "text" },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Téléphone", type: "tel", required: true },
  { name: "startDate", label: "Du", type: "date" },
  { name: "endDate", label: "Au", type: "date" },
  { name: "guests", label: "Personnes", type: "number" },
  { name: "rooms", label: "Chambres", type: "number" },
  { name: "needs", label: "Besoin exprimé par le client", type: "textarea" },
  { name: "quoteAmount", label: "Montant du devis (FCFA)", type: "number" },
  { name: "quoteNotes", label: "Détail du devis (envoyé au client)", type: "textarea", help: "Salle, pauses, repas, chambres, conditions… Ce texte figure dans l'email du devis." },
  { name: "adminNotes", label: "Notes internes", type: "textarea", help: "Jamais envoyées au client." },
];

function SendQuoteButton({ item, refresh }: { item: Item; refresh: () => void }) {
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!confirm(`Envoyer le devis à ${item.email} ?`)) return;
    setSending(true);
    try {
      await api.post(`/api/admin/quotes/${item.id}/send`);
      toast.success("Devis envoyé");
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };
  return (
    <Button variant="ghost" size="icon" onClick={send} disabled={sending} aria-label="Envoyer le devis par email" title="Envoyer le devis par email">
      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  );
}

export default function QuotesAdminPage() {
  return (
    <CrudManager
      resource="quotes"
      title="Demandes de devis"
      description="Groupes, séminaires et événements : demandes reçues via le site, suivi et envoi des devis."
      singular="Demande"
      fields={fields}
      defaults={{ type: "GROUPE", status: "NEW" }}
      intro="Renseignez le montant et le détail du devis (crayon), puis envoyez-le avec l'icône d'avion : la demande passe en « Devis envoyé ». Mettez ensuite le statut à « Acceptée » ou « Sans suite »."
      emptyText="Aucune demande pour le moment. Les demandes du formulaire /devis apparaîtront ici."
      summary={(q: Item) => ({
        title: `${q.contactName}${q.companyName ? ` · ${q.companyName}` : ""}`,
        subtitle: [lbl(TYPES, q.type), q.startDate ? `${formatDate(q.startDate)}${q.endDate ? ` → ${formatDate(q.endDate)}` : ""}` : "", q.guests ? `${q.guests} pers.` : "", q.rooms ? `${q.rooms} ch.` : ""].filter(Boolean).join(" · "),
        meta: [String(q.reference ?? ""), `reçue le ${formatDate(q.createdAt)}`, q.quoteAmount != null ? `devis ${formatXof(q.quoteAmount)}` : ""].filter(Boolean).join(" · "),
        badges: [
          {
            label: lbl(STATUSES, q.status),
            tone: q.status === "NEW" ? ("danger" as const) : q.status === "WON" ? ("primary" as const) : q.status === "LOST" ? ("muted" as const) : ("default" as const),
          },
        ],
      })}
      rowActions={(q, refresh) => (
        <>
          <Button variant="ghost" size="icon" asChild aria-label="WhatsApp">
            <a href={whatsappHref(String(q.phone), `Bonjour ${q.contactName}, ici l'Hôtel Nahoui Balmer au sujet de votre demande de devis ${q.reference ?? ""}.`)} target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Email">
            <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Votre demande ${q.reference ?? ""}`)}`} title="Email">
              <Mail className="h-4 w-4" />
            </a>
          </Button>
          <SendQuoteButton item={q} refresh={refresh} />
        </>
      )}
    />
  );
}
