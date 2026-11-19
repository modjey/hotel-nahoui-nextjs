"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Send } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { HOTEL_CONTACT } from "@/lib/hotel-contact";

type QuoteType = "GROUPE" | "SEMINAIRE" | "EVENEMENT";

const TYPES: { value: QuoteType; label: string; hint: string }[] = [
  { value: "GROUPE", label: "Séjour de groupe", hint: "Plusieurs chambres pour une équipe, une famille, un voyage…" },
  { value: "SEMINAIRE", label: "Séminaire / réunion", hint: "Salle équipée, pauses, déjeuners, hébergement des participants." },
  { value: "EVENEMENT", label: "Événement privé", hint: "Mariage, anniversaire, cocktail, soirée d'entreprise…" },
];

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all";

/** Demande de devis groupe / séminaire / événement (traitée dans Admin → Demandes de devis). */
export function QuotePage({ seminarRooms }: { seminarRooms: { name: string; capacity: string | null }[] }) {
  const params = useSearchParams();
  const preset = params?.get("type")?.toUpperCase();
  const [form, setForm] = useState({
    type: (TYPES.some((t) => t.value === preset) ? preset : "GROUPE") as QuoteType,
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    startDate: "",
    endDate: "",
    guests: "",
    rooms: "",
    needs: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) setDone(json.data.reference);
      else setError(json.error?.message ?? "Envoi impossible, réessayez.");
    } catch {
      setError("Connexion impossible, réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">Groupes, séminaires & événements</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance">Demander un devis</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Décrivez votre projet : notre équipe commerciale vous envoie une proposition chiffrée par email, en général sous 48 h.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 lg:px-10 py-14 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <aside className="space-y-6 text-sm">
          {seminarRooms.length > 0 && (
            <div>
              <h2 className="font-display text-xl mb-3">Nos salles</h2>
              <ul className="space-y-2">
                {seminarRooms.map((r) => (
                  <li key={r.name} className="border-b border-border pb-2">
                    <span className="font-medium">{r.name}</span>
                    {r.capacity && <span className="block text-muted-foreground">{r.capacity}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="font-display text-xl mb-3">Une question ?</h2>
            <p className="text-muted-foreground">Appelez-nous au {HOTEL_CONTACT.phones[0]} ou écrivez à {HOTEL_CONTACT.reservationsEmail}.</p>
          </div>
        </aside>

        <div className="lg:col-span-2 bg-card border border-border p-7 lg:p-10">
          {done ? (
            <div className="text-center py-10">
              <CheckCircle className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
              <h2 className="font-display text-2xl mt-4">Demande envoyée</h2>
              <p className="text-muted-foreground mt-2">
                Référence <span className="font-mono text-foreground">{done}</span>. Un email de confirmation vous a été envoyé ; nous revenons vers vous rapidement.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <fieldset>
                <legend className="eyebrow text-muted-foreground">Type de demande</legend>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TYPES.map((t) => (
                    <label key={t.value} className={`cursor-pointer border p-4 text-sm transition-colors ${form.type === t.value ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground/40"}`}>
                      <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={() => set("type", t.value)} className="sr-only" />
                      <span className="font-medium block">{t.label}</span>
                      <span className="text-muted-foreground text-xs">{t.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Nom et prénom *</span>
                  <input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} autoComplete="name" className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Entreprise / organisation</span>
                  <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} autoComplete="organization" className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Email *</span>
                  <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Téléphone *</span>
                  <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+225 07 00 00 00 00" className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Date de début</span>
                  <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Date de fin</span>
                  <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Nombre de personnes</span>
                  <input type="number" min={1} inputMode="numeric" value={form.guests} onChange={(e) => set("guests", e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Chambres souhaitées</span>
                  <input type="number" min={0} inputMode="numeric" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} className={inputClass} />
                </label>
              </div>

              <label className="block">
                <span className="eyebrow text-muted-foreground">Votre besoin</span>
                <textarea
                  rows={5}
                  value={form.needs}
                  onChange={(e) => set("needs", e.target.value)}
                  placeholder="Programme, disposition de salle, repas, matériel, budget…"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all"
                />
              </label>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

              <button type="submit" disabled={submitting} className="btn-fill-editorial w-full disabled:opacity-60">
                {submitting ? "Envoi en cours…" : (<><Send className="h-3.5 w-3.5" /> Envoyer ma demande</>)}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
