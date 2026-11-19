"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import { api, ApiError } from "@/lib/api-client";
import { flushPendingUploads } from "@/lib/pending-uploads";

type Values = Record<string, string | number>;

type Field = { name: string; label: string; type?: "text" | "textarea" | "image" | "number"; help?: string; rows?: number };

/** Une carte = un réglage (clé SiteSetting), chargé et enregistré indépendamment. */
function SettingCard({ settingKey, title, description, fields, children }: { settingKey: string; title: string; description: string; fields: Field[]; children?: ReactNode }) {
  const [values, setValues] = useState<Values | null>(null);
  const [saving, setSaving] = useState(false);
  const { loading } = useApi<{ value: Values }>(`/api/admin/settings/${settingKey}`, {
    onSuccess: (data) => setValues(data.value),
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    try {
      const uploaded = await flushPendingUploads();
      const payload: Values = { ...values };
      for (const f of fields) {
        const key = `${settingKey}-${f.name}`;
        if (f.type === "image" && uploaded[key]) payload[f.name] = uploaded[key];
      }
      const res = await api.put<{ value: Values }>(`/api/admin/settings/${settingKey}`, payload);
      setValues(res.value);
      toast.success(`${title} : enregistré`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-2xl bg-card border border-border p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {children}
      {loading || !values ? (
        <div className="py-8 text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <div className="mt-5 space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={`${settingKey}-${f.name}`}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea id={`${settingKey}-${f.name}`} rows={f.rows ?? 4} value={String(values[f.name] ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
              ) : f.type === "image" ? (
                <ImageUpload value={String(values[f.name] ?? "")} onChange={(url) => setValues({ ...values, [f.name]: url })} folder="site" name={`${settingKey}-${f.name}`} />
              ) : (
                <Input id={`${settingKey}-${f.name}`} type={f.type === "number" ? "number" : "text"} value={String(values[f.name] ?? "")} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
              )}
              {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
            </div>
          ))}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
          </Button>
        </div>
      )}
    </form>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Paramètres" description="Page d'accueil, conditions de réservation et informations de la facture proforma." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SettingCard
          settingKey="home"
          title="Page d'accueil"
          description="Grande image ou vidéo d'ouverture et texte principal."
          fields={[
            { name: "heroImageUrl", label: "Photo d'accueil", type: "image", help: "Affichée seule si aucune vidéo, ou pendant le chargement de la vidéo." },
            { name: "heroVideoUrl", label: "Vidéo d'accueil (lien .mp4)", help: "Laisser vide pour n'afficher que la photo. Valeur actuelle par défaut : /assets/banner.mp4" },
            { name: "heroEyebrow", label: "Petite ligne au-dessus du titre" },
            { name: "heroTitle", label: "Titre" },
            { name: "heroSubtitle", label: "Texte de présentation", type: "textarea", rows: 3 },
          ]}
        />
        <div className="space-y-6">
          <SettingCard
            settingKey="booking"
            title="Conditions de réservation"
            description="Publiées sur la page /conditions, rappelées dans les emails et sur la proforma."
            fields={[{ name: "conditions", label: "Conditions (une règle par ligne)", type: "textarea", rows: 9 }]}
          />
          <SettingCard
            settingKey="proforma"
            title="Facture proforma"
            description="En-tête et mentions de la proforma envoyée aux clients."
            fields={[
              { name: "companyName", label: "Raison sociale" },
              { name: "address", label: "Adresse", type: "textarea", rows: 2 },
              { name: "phone", label: "Téléphone(s)" },
              { name: "email", label: "Email" },
              { name: "legalIds", label: "Identifiants légaux", help: "RCCM, compte contribuable…" },
              { name: "paymentDetails", label: "Modalités de règlement", type: "textarea", rows: 4, help: "Numéros Mobile Money, coordonnées bancaires, paiement à l'arrivée…" },
              { name: "validityDays", label: "Validité (jours)", type: "number" },
              { name: "footerNote", label: "Mention en bas de proforma", type: "textarea", rows: 2 },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
