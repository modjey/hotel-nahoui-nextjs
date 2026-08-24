"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useMutation } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { roomTypeUpdateSchema } from "@/lib/catalog/schemas";
import { z } from "zod";

type RoomType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  _count: { rooms: number };
};

export default function AdminRoomTypeEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [rt, setRt] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ type: RoomType }>(`/api/admin/admin-room-types/${slug}`);
        setRt(data.type);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const update = useMutation<{ type: RoomType }, z.infer<typeof roomTypeUpdateSchema>>(
    `/api/admin/admin-room-types/${slug}`,
    { method: "PATCH", onSuccess: () => toast.success("Mis à jour") },
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

    const result = roomTypeUpdateSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, msgs]) => {
        toast.error(`${field}: ${msgs?.join(", ")}`);
      });
      return;
    }

    await update.mutate(result.data);
  };

  const deleteType = async () => {
    if (!confirm("Supprimer ce type ?")) return;
    try {
      await api.del(`/api/admin/admin-room-types/${slug}`);
      toast.success("Supprimé");
      router.push("/admin/admin-room-types");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!rt) return <div className="p-8 text-red-500">Type introuvable</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.push("/admin/admin-room-types")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>

      <h1 className="text-3xl font-bold mb-8">Modifier {rt.name}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border">
        <div>
          <Label>Nom *</Label>
          <Input name="name" defaultValue={rt.name} required />
        </div>
        <div>
          <Label>Slug</Label>
          <Input name="slug" defaultValue={rt.slug} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" defaultValue={rt.description ?? ""} rows={3} />
        </div>
        <div>
          <Label>Ordre</Label>
          <Input name="order" type="number" defaultValue={rt.order} />
        </div>
        <div className="flex items-center gap-2">
          <Switch name="isPublished" defaultChecked={rt.isPublished} />
          <Label>Publié</Label>
        </div>
        <div className="flex gap-4">
          <Button type="submit" disabled={update.loading} className="flex-1">
            {update.loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Enregistrer
          </Button>
          <Button type="button" variant="destructive" onClick={deleteType}>
            Supprimer
          </Button>
        </div>
      </form>
    </div>
  );
}
