"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { api, ApiError } from "@/lib/api-client";
import { roomTypeCreateSchema } from "@/lib/catalog/schemas";

type RoomType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  _count: { rooms: number };
};

type Form = { name: string; slug: string; description: string; isPublished: boolean };
const EMPTY: Form = { name: "", slug: "", description: "", isPublished: true };

/** Types de chambre (Suite, Confort…), gérés dans l'onglet « Types » de la page Chambres. */
export function RoomTypesPanel({ onChange }: { onChange?: () => void }) {
  const { data, loading, error, refetch } = useApi<{ types: RoomType[] }>("/api/admin/admin-room-types");
  const [search, setSearch] = useState("");
  const [reordering, setReordering] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const types = data?.types ?? [];
  const filtered = types.filter((t) => (search ? t.name.toLowerCase().includes(search.toLowerCase()) : true));

  const refresh = () => {
    refetch();
    onChange?.();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (t: RoomType) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, description: t.description ?? "", isPublished: t.isPublished });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = roomTypeCreateSchema.safeParse({
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      isPublished: form.isPublished,
    });
    if (!parsed.success) {
      const { fieldErrors } = parsed.error.flatten();
      return toast.error(fieldErrors.name ? "Nom requis (2 caractères minimum)" : fieldErrors.slug ? "Slug invalide" : "Formulaire invalide");
    }
    setSaving(true);
    try {
      if (editing) await api.patch(`/api/admin/admin-room-types/${editing.slug}`, parsed.data);
      else await api.post("/api/admin/admin-room-types", parsed.data);
      toast.success(editing ? "Type mis à jour" : "Type créé");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= types.length) return;
    const ids = types.map((t) => t.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    try {
      await api.post("/api/admin/admin-room-types/reorder", { ids });
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setReordering(false);
    }
  };

  const remove = async (t: RoomType) => {
    if (!confirm(`Supprimer le type « ${t.name} » ?`)) return;
    try {
      await api.del(`/api/admin/admin-room-types/${t.slug}`);
      toast.success("Type supprimé");
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
          <Input placeholder="Rechercher un type…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 max-w-md" />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouveau type
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Chambres</TableHead>
            <TableHead>Ordre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !data ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8">Chargement…</TableCell></TableRow>
          ) : error ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-destructive">Erreur de chargement</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {search ? "Aucun type trouvé" : "Aucun type : créez-en un pour classer vos chambres."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((t, i) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Tag className="h-4 w-4" />
                    </div>
                    <span>{t.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{t.description || "-"}</TableCell>
                <TableCell>{t._count.rooms}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" disabled={reordering || search !== "" || i === 0} onClick={() => move(i, -1)} aria-label="Monter">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={reordering || search !== "" || i === filtered.length - 1} onClick={() => move(i, 1)} aria-label="Descendre">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={t.isPublished ? "default" : "secondary"}>{t.isPublished ? "Publié" : "Brouillon"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label={`Modifier ${t.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t)} className="text-destructive hover:text-destructive" aria-label={`Supprimer ${t.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? `Modifier : ${editing.name}` : "Nouveau type de chambre"}</DialogTitle>
              <DialogDescription>
                {editing ? `${editing._count.rooms} chambre(s) rattachée(s) à ce type.` : "Créez une nouvelle catégorie de chambre."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid gap-1.5">
                <Label htmlFor="rt-name">Nom *</Label>
                <Input id="rt-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Suite Présidentielle" autoFocus />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rt-slug">Slug (optionnel)</Label>
                <Input id="rt-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="généré à partir du nom" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rt-description">Description</Label>
                <Textarea id="rt-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="rt-published" checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                <Label htmlFor="rt-published">Publié</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
