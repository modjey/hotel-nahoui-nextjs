"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, Trash2, X, ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AmenitiesInput } from "@/components/admin/AmenitiesInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { api, ApiError } from "@/lib/api-client";
import { flushPendingUploads } from "@/lib/pending-uploads";
import { compressImage } from "@/lib/image-compress";

/**
 * Gestionnaire générique des contenus de l'admin (offres, événements, espaces,
 * fermetures, tarifs, devis...). Liste + formulaire en fenêtre, décrit par `fields`.
 * Les données passent par /api/admin/content/<resource>.
 */

export type Option = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  /**
   * "link" : liste de destinations (`options`) avec saisie libre via « Autre lien… ».
   * "tags" : ajout dynamique d'éléments (comme les équipements des chambres), avec `suggestions`.
   */
  type: "text" | "textarea" | "number" | "date" | "boolean" | "select" | "image" | "gallery" | "list" | "email" | "tel" | "link" | "tags";
  /** Champ "tags" : propositions cliquables. */
  suggestions?: string[];
  options?: Option[];
  /** Options chargées depuis l'API (ex : chambres). */
  optionsFrom?: { url: string; key: string; value: (o: Record<string, unknown>) => string; label: (o: Record<string, unknown>) => string; emptyLabel?: string };
  required?: boolean;
  help?: string;
  placeholder?: string;
  full?: boolean;
  /** Champ "link" : libellé du choix « vide ». */
  noneLabel?: string;
  /** Dossier d'upload pour les images. */
  folder?: string;
};

export type Item = Record<string, unknown> & { id: string };

export type Summary = {
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: { label: string; tone?: "default" | "muted" | "primary" | "danger" }[];
  image?: string | null;
};

type Props = {
  resource: string;
  title: string;
  description: string;
  singular: string;
  fields: FieldDef[];
  defaults?: Record<string, unknown>;
  summary: (item: Item) => Summary;
  /** Actions supplémentaires par ligne (ex : envoyer le devis). */
  rowActions?: (item: Item, refresh: () => void) => ReactNode;
  /** Contenu au-dessus de la liste (aide, filtres...). */
  intro?: ReactNode;
  /** Masque le bouton de création (ex : ressources créées par le site). */
  canCreate?: boolean;
  emptyText?: string;
};

const BADGE_TONES = {
  default: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
};

function toInputDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toForm(fields: FieldDef[], source: Record<string, unknown>) {
  const form: Record<string, unknown> = {};
  for (const f of fields) {
    const v = source[f.name];
    if (f.type === "date") form[f.name] = toInputDate(v);
    else if (f.type === "boolean") form[f.name] = Boolean(v);
    else if (f.type === "list") form[f.name] = Array.isArray(v) ? v.join("\n") : (v ?? "");
    else if (f.type === "gallery" || f.type === "tags") form[f.name] = Array.isArray(v) ? v : [];
    else form[f.name] = v ?? "";
  }
  return form;
}

export function formatDate(v: unknown) {
  if (!v) return "";
  return new Date(String(v)).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatXof(v: unknown) {
  if (v === null || v === undefined || v === "") return "";
  return `${new Intl.NumberFormat("fr-FR").format(Number(v)).replace(/ | /g, " ")} FCFA`;
}

function GalleryInput({ value, onChange, folder }: { value: string[]; onChange: (v: string[]) => void; folder: string }) {
  const [uploading, setUploading] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const raw of Array.from(files)) {
        const file = await compressImage(raw);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error?.message ?? "Erreur d'upload");
        urls.push(json.data.url);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'upload");
    } finally {
      if (urls.length) onChange([...value, ...urls]);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 h-7 w-7 grid place-items-center rounded-full bg-background/90 text-foreground shadow"
                aria-label="Retirer cette image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-dashed border-border text-sm cursor-pointer hover:bg-muted">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Envoi en cours…" : "Ajouter des photos"}
        <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      </label>
    </div>
  );
}

function RemoteSelect({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const src = field.optionsFrom!;
  const { data, loading } = useApi<Record<string, Record<string, unknown>[]>>(src.url);
  const options: Option[] = [
    ...(src.emptyLabel ? [{ value: "all", label: src.emptyLabel }] : []),
    ...((data?.[src.key] ?? []).map((o) => ({ value: src.value(o), label: src.label(o) }))),
  ];
  return (
    <Select value={value || (src.emptyLabel ? "all" : undefined)} onValueChange={onChange} disabled={loading}>
      <SelectTrigger id={field.name}>
        <SelectValue placeholder={loading ? "Chargement…" : "Choisir"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const LINK_NONE = "__none";
const LINK_CUSTOM = "__custom";

function LinkSelect({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const options = field.options ?? [];
  // Une URL absente de la liste (saisie à la main, ou données existantes) bascule en saisie libre.
  const [custom, setCustom] = useState(() => Boolean(value) && !options.some((o) => o.value === value));
  const selected = custom ? LINK_CUSTOM : value || LINK_NONE;
  return (
    <div className="space-y-2">
      <Select
        value={selected}
        onValueChange={(v) => {
          setCustom(v === LINK_CUSTOM);
          if (v === LINK_NONE) onChange("");
          else if (v !== LINK_CUSTOM) onChange(v);
        }}
      >
        <SelectTrigger id={field.name}><SelectValue placeholder="Choisir une destination" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={LINK_NONE}>{field.noneLabel ?? "Aucun lien"}</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          <SelectItem value={LINK_CUSTOM}>Autre lien…</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <Input
          aria-label={`${field.label} (lien personnalisé)`}
          value={value}
          placeholder={field.placeholder ?? "https://… ou /page"}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

export function CrudManager({ resource, title, description, singular, fields, defaults = {}, summary, rowActions, intro, canCreate = true, emptyText }: Props) {
  const endpoint = `/api/admin/content/${resource}`;
  const { data, loading, refetch } = useApi<{ items: Item[] }>(endpoint);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((it) => {
      const s = summary(it);
      return [s.title, s.subtitle, s.meta].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [data, search, summary]);

  const openCreate = () => {
    setEditing(null);
    setForm(toForm(fields, defaults));
    setOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm(toForm(fields, item));
    setOpen(true);
  };

  const set = (name: string, value: unknown) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && (form[f.name] === "" || form[f.name] === undefined || form[f.name] === null)) {
        toast.error(`« ${f.label} » est requis`);
        return;
      }
    }
    setSaving(true);
    try {
      const uploaded = await flushPendingUploads();
      const payload: Record<string, unknown> = { ...form };
      for (const f of fields) {
        if (f.type === "image" && uploaded[`${resource}-${f.name}`]) payload[f.name] = uploaded[`${resource}-${f.name}`];
        if (f.type === "image" && typeof payload[f.name] === "string" && String(payload[f.name]).startsWith("blob:")) payload[f.name] = "";
        if (f.type === "number" && payload[f.name] !== "") payload[f.name] = Number(payload[f.name]);
        if (f.type === "select" && payload[f.name] === "all") payload[f.name] = "";
      }
      if (editing) await api.patch(`${endpoint}/${editing.id}`, payload);
      else await api.post(endpoint, payload);
      toast.success(editing ? "Modifications enregistrées" : `${singular} créé(e)`);
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Item) => {
    if (!confirm(`Supprimer « ${summary(item).title} » ? Cette action est définitive.`)) return;
    try {
      await api.del(`${endpoint}/${item.id}`);
      toast.success("Supprimé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  };

  const renderField = (f: FieldDef) => {
    const value = form[f.name];
    switch (f.type) {
      case "textarea":
      case "list":
        return (
          <Textarea id={f.name} rows={f.type === "list" ? 4 : 5} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
        );
      case "boolean":
        return (
          <div className="flex items-center gap-3 h-10">
            <Switch id={f.name} checked={Boolean(value)} onCheckedChange={(v) => set(f.name, v)} />
            <span className="text-sm text-muted-foreground">{value ? "Oui" : "Non"}</span>
          </div>
        );
      case "select":
        if (f.optionsFrom) return <RemoteSelect field={f} value={String(value ?? "")} onChange={(v) => set(f.name, v)} />;
        return (
          <Select value={String(value ?? "")} onValueChange={(v) => set(f.name, v)}>
            <SelectTrigger id={f.name}><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {(f.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "tags":
        return (
          <AmenitiesInput
            value={(value as string[]) ?? []}
            onChange={(v) => set(f.name, v)}
            placeholder={f.placeholder ?? "Ajouter un élément et appuyer sur Entrée"}
            suggestions={f.suggestions}
          />
        );
      case "link":
        return <LinkSelect key={editing?.id ?? "new"} field={f} value={String(value ?? "")} onChange={(v) => set(f.name, v)} />;
      case "image":
        return <ImageUpload value={String(value ?? "")} onChange={(url) => set(f.name, url)} folder={f.folder ?? resource} name={`${resource}-${f.name}`} />;
      case "gallery":
        return <GalleryInput value={(value as string[]) ?? []} onChange={(v) => set(f.name, v)} folder={f.folder ?? resource} />;
      default:
        return (
          <Input
            id={f.name}
            type={f.type === "number" ? "number" : f.type}
            value={String(value ?? "")}
            placeholder={f.placeholder}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={canCreate ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        ) : undefined}
      />

      {intro && <div className="mb-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">{intro}</div>}

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {loading && !data ? (
          <div className="p-8 text-center text-muted-foreground">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            {search ? "Aucun résultat" : emptyText ?? "Aucun élément pour le moment."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const s = summary(item);
              return (
                <li key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/40">
                  {s.image !== undefined && (
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.title}</div>
                    {s.subtitle && <div className="text-sm text-muted-foreground truncate">{s.subtitle}</div>}
                    {s.meta && <div className="text-xs text-muted-foreground mt-0.5">{s.meta}</div>}
                    {s.badges && s.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.badges.map((b) => (
                          <span key={b.label} className={`text-xs px-2 py-0.5 rounded ${BADGE_TONES[b.tone ?? "default"]}`}>{b.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {rowActions?.(item, refetch)}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(item)} className="text-destructive hover:text-destructive" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? `Modifier : ${summary(editing).title}` : `Ajouter : ${singular}`}</DialogTitle>
              <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5">
              {fields.map((f) => (
                <div key={f.name} className={f.full || ["textarea", "list", "image", "gallery", "tags"].includes(f.type) ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={f.name}>{f.label}{f.required ? " *" : ""}</Label>
                  {renderField(f)}
                  {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
