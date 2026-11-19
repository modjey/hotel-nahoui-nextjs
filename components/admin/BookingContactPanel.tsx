"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Mail, MessageCircle, Phone, Send, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";

/** Numéro → lien WhatsApp (indicatif +225 ajouté aux numéros ivoiriens à 10 chiffres). */
export function whatsappHref(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `225${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

type Props = {
  bookingId: string;
  reference: string | null;
  status: string;
  guestName: string;
  email: string | null;
  phone: string | null;
};

/** Contacter le client, le relancer et lui transmettre la proforma depuis la fiche réservation. */
export function BookingContactPanel({ bookingId, reference, status, guestName, email, phone }: Props) {
  const [sending, setSending] = useState<"proforma" | "reminder" | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");

  const sendProforma = async () => {
    if (!email) return;
    if (!confirm(`Envoyer la facture proforma à ${email} ?`)) return;
    setSending("proforma");
    try {
      const res = await api.post<{ sentTo: string; number: string }>(`/api/admin/admin-bookings/${bookingId}/proforma`);
      toast.success(`Proforma ${res.number} envoyée à ${res.sentTo}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Envoi impossible");
    } finally {
      setSending(null);
    }
  };

  const sendReminder = async () => {
    setSending("reminder");
    try {
      const res = await api.post<{ sentTo: string }>(`/api/admin/admin-bookings/${bookingId}/reminder`, { message: reminderText.trim() || null });
      toast.success(`Relance envoyée à ${res.sentTo}`);
      setReminderOpen(false);
      setReminderText("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Envoi impossible");
    } finally {
      setSending(null);
    }
  };

  const waText = `Bonjour ${guestName}, ici l'Hôtel Nahoui Balmer au sujet de votre réservation${reference ? ` ${reference}` : ""}.`;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm">
        <div className="font-medium">Contacter {guestName}</div>
        <div className="text-muted-foreground">
          {status === "PENDING" ? "Demande en attente : convenez du règlement puis confirmez la réservation." : "Coordonnées et documents du client."}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {phone && (
          <>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4" /> Appeler</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={whatsappHref(phone, waText)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            </Button>
          </>
        )}
        {email && (
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${email}?subject=${encodeURIComponent(`Votre réservation ${reference ?? ""}`.trim())}`}><Mail className="h-4 w-4" /> Email</a>
          </Button>
        )}
        {status === "PENDING" && email && (
          <Button variant="outline" size="sm" onClick={() => setReminderOpen(true)}>
            <BellRing className="h-4 w-4" /> Relancer
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <a href={`/admin/proforma/${bookingId}`} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /> Proforma</a>
        </Button>
        {email && (
          <Button size="sm" onClick={sendProforma} disabled={sending === "proforma"}>
            {sending === "proforma" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer la proforma
          </Button>
        )}
      </div>

      <Dialog open={reminderOpen} onOpenChange={(o) => sending !== "reminder" && setReminderOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relancer {guestName}</DialogTitle>
            <DialogDescription>
              Un email récapitulant la demande (dates, montant, délai de réservation) est envoyé à {email}. Ajoutez un message personnel si besoin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            placeholder="Laisser vide pour le message standard : « Pour confirmer votre réservation, il reste à convenir du règlement… »"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderOpen(false)} disabled={sending === "reminder"}>Annuler</Button>
            <Button onClick={sendReminder} disabled={sending === "reminder"}>
              {sending === "reminder" && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer la relance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
