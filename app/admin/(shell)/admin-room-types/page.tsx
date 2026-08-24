"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { roomTypeCreateSchema } from "@/lib/catalog/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";

type RoomType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  _count: { rooms: number };
};

export default function AdminRoomTypesPage() {
  const { data, loading, error, refetch } = useApi<{ types: RoomType[] }>(
    "/api/admin/admin-room-types",
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const create = useMutation<{ type: RoomType }, z.infer<typeof roomTypeCreateSchema>>(
    "/api/admin/admin-room-types",
    {
      onSuccess: () => {
        toast.success("Type créé");
        setOpen(false);
        refetch();
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const data = {
      ...raw,
      isPublished: raw.isPublished === "on",
      order: raw.order ? Number(raw.order) : 0,
    };

    const result = roomTypeCreateSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, msgs]) => {
        toast.error(`${field}: ${msgs?.join(", ")}`);
      });
      return;
    }

    await create.mutate(result.data);
  };

  const deleteType = async (slug: string) => {
    if (!confirm("Supprimer ce type ?")) return;
    try {
      await api.del(`/api/admin/admin-room-types/${slug}`);
      toast.success("Supprimé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const filtered = (data?.types ?? []).filter((t) =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div>
      <PageHeader
        title="Types de chambre"
        description="Gérez les catégories de chambres (Suite, Confort, etc.)."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Nouveau type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau type de chambre</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle catégorie de chambre.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input id="name" name="name" required placeholder="Suite Présidentielle" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug (optionnel)</Label>
                  <Input id="slug" name="slug" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order">Ordre d'affichage</Label>
                  <Input id="order" name="order" type="number" defaultValue={0} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isPublished" name="isPublished" defaultChecked />
                  <Label htmlFor="isPublished">Publié</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={create.loading}>
                    Créer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-destructive">
                  Erreur de chargement
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun type trouvé
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Tag className="h-4 w-4" />
                      </div>
                      <span>{t.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {t.description || "—"}
                  </TableCell>
                  <TableCell>{t._count.rooms}</TableCell>
                  <TableCell className="text-muted-foreground">{t.order}</TableCell>
                  <TableCell>
                    <Badge variant={t.isPublished ? "default" : "secondary"}>
                      {t.isPublished ? "Publié" : "Brouillon"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/admin-room-types/${t.slug}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteType(t.slug)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
