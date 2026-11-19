"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { api, ApiError } from "@/lib/api-client";

export type DishCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  _count?: { dishes: number };
};

type Form = { name: string; description: string; order: string; isPublished: boolean };
const EMPTY: Form = { name: "", description: "", order: "0", isPublished: true };

/** Catégories du menu, gérées dans l'onglet « Catégories » de la page Plats. */
export function DishCategoriesPanel({ onChange }: { onChange?: () => void }) {
  const { data, loading, refetch } = useApi<{ categories: DishCategory[] }>("/api/admin/admin-dish-categories");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DishCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const categories = (data?.categories ?? []).filter((c) =>
    search ? [c.name, c.description].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()) : true,
  );

  const refresh = () => {
    refetch();
    onChange?.();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, order: String(data?.categories.length ?? 0) });
    setOpen(true);
  };

  const openEdit = (c: DishCategory) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "", order: String(c.order), isPublished: c.isPublished });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Le nom de la catégorie est requis");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      order: Number(form.order) || 0,
      isPublished: form.isPublished,
    };
    try {
      if (editing) await api.patch(`/api/admin/admin-dish-categories/${editing.id}`, payload);
      else await api.post("/api/admin/admin-dish-categories", payload);
      toast.success(editing ? "Catégorie mise à jour" : "Catégorie créée");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: DishCategory) => {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    try {
      await api.del(`/api/admin/admin-dish-categories/${c.id}`);
      toast.success("Catégorie supprimée");
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une catégorie…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </Button>
      </div>

      {loading && !data ? (
        <div className="p-8 text-center text-muted-foreground">Chargement…</div>
      ) : categories.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">{search ? "Aucun résultat" : "Aucune catégorie : créez-en une pour classer vos plats."}</div>
      ) : (
        <ul className="divide-y divide-border">
          {categories.map((c) => (
            <li key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50">
              <div className="min-w-0">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {[`${c._count?.dishes ?? 0} plat(s)`, `ordre ${c.order}`, c.description].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!c.isPublished && <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Brouillon</span>}
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={`Modifier ${c.name}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c)} className="text-destructive hover:text-destructive" aria-label={`Supprimer ${c.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? `Modifier : ${editing.name}` : "Nouvelle catégorie"}</DialogTitle>
              <DialogDescription>Les catégories structurent la carte du restaurant sur le site.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid gap-1.5">
                <Label htmlFor="cat-name">Nom *</Label>
                <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Entrées, Grillades, Desserts…" autoFocus />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cat-description">Description</Label>
                <Textarea id="cat-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cat-order">Ordre d&apos;affichage</Label>
                  <Input id="cat-order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cat-published">Publiée</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch id="cat-published" checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                    <span className="text-sm text-muted-foreground">{form.isPublished ? "Oui" : "Non"}</span>
                  </div>
                </div>
              </div>
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
