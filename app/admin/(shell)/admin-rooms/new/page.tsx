"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AmenitiesInput } from "@/components/admin/AmenitiesInput";
import { api } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { roomCreateSchema, parseYoutubeId } from "@/lib/catalog/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2, Youtube } from "lucide-react";

type PendingMedia = {
  localId: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  title?: string;
};

type LocationOption = { id: string; name: string; city: string | null };
type RoomTypeOption = { id: string; name: string };

export default function NewRoomPage() {
  const router = useRouter();
  const { data: locsData } = useApi<{ locations: LocationOption[] }>("/api/admin/admin-locations");
  const { data: typesData } = useApi<{ types: RoomTypeOption[] }>("/api/admin/admin-room-types");

  const [locationId, setLocationId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [checkInStart, setCheckInStart] = useState("15:00");
  const [checkInEnd, setCheckInEnd] = useState("22:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [checkInMethod, setCheckInMethod] = useState("Arrivée autonome avec clavier");
  const [cancellationPolicy, setCancellationPolicy] = useState("Annulation gratuite avant 7 jours, 50% de remboursement avant 3 jours");
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const handleGalleryFiles = async (files: FileList) => {
    setUploadingMedia(true);
    const added: PendingMedia[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "rooms");
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error?.message ?? "Erreur d'upload");
        added.push({
          localId: crypto.randomUUID(),
          type: "IMAGE",
          url: json.data.url,
          title: file.name,
        });
      }
      setPendingMedia((prev) => [...prev, ...added]);
      toast.success(`${added.length} image${added.length > 1 ? "s" : ""} prête${added.length > 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploadingMedia(false);
      if (galleryFileRef.current) galleryFileRef.current.value = "";
    }
  };

  const addYoutubePending = () => {
    if (!youtubeUrl.trim()) return;
    setPendingMedia((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        type: "VIDEO",
        url: youtubeUrl.trim(),
        title: "Vidéo YouTube",
      },
    ]);
    setYoutubeUrl("");
    toast.success("Vidéo prête");
  };

  const removePending = (localId: string) => {
    setPendingMedia((prev) => prev.filter((m) => m.localId !== localId));
  };

  const create = useMutation<{ room: { id: string; slug: string } }, z.infer<typeof roomCreateSchema>>(
    "/api/admin/admin-rooms",
    {
      onSuccess: async (res) => {
        // Attacher tous les médias en attente à la chambre créée
        if (pendingMedia.length > 0) {
          try {
            await Promise.all(
              pendingMedia.map((m, i) =>
                api.post("/api/admin/admin-media", {
                  type: m.type,
                  url: m.url,
                  title: m.title,
                  order: i,
                  roomId: res.room.id,
                }),
              ),
            );
            toast.success(`Chambre créée avec ${pendingMedia.length} média${pendingMedia.length > 1 ? "s" : ""}`);
          } catch {
            toast.warning("Chambre créée mais certains médias n'ont pas pu être attachés");
          }
        } else {
          toast.success("Chambre créée");
        }
        router.push(`/admin/admin-rooms/${res.room.slug}`);
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      ...raw,
      locationId,
      roomTypeId,
      currency,
      roomNumber: raw.roomNumber || null,
      coverImageUrl: coverImageUrl || null,
      amenities,
      isPublished: raw.isPublished === "on",
      basePrice: raw.basePrice ? Number(raw.basePrice) : 0,
      maxGuests: raw.maxGuests ? Number(raw.maxGuests) : 2,
      beds: raw.beds ? Number(raw.beds) : 1,
      bathrooms: raw.bathrooms ? Number(raw.bathrooms) : 1,
      sizeSqm: raw.sizeSqm ? Number(raw.sizeSqm) : null,
      checkInStart,
      checkInEnd,
      checkOutTime,
      checkInMethod,
      cancellationPolicy,
    };

    const result = roomCreateSchema.safeParse(payload);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, msgs]) => {
        toast.error(`${field}: ${msgs?.join(", ")}`);
      });
      return;
    }

    await create.mutate(result.data);
  };

  return (
    <div>
      <Link
        href="/admin/admin-rooms"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux chambres
      </Link>

      <PageHeader
        title="Nouvelle chambre"
        description="Créez une nouvelle chambre rattachée à une localisation et un type."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Informations générales</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="roomNumber">Numéro de chambre</Label>
            <Input id="roomNumber" name="roomNumber" placeholder="Ex: 101" maxLength={50} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Localisation *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {locsData?.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                      {l.city ? ` (${l.city})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Type de chambre *</Label>
              <Select value={roomTypeId} onValueChange={setRoomTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {typesData?.types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Input id="shortDescription" name="shortDescription" maxLength={280} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={5} />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Tarif & capacité</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="basePrice">Prix de base *</Label>
              <Input id="basePrice" name="basePrice" type="number" required />
            </div>
            <div className="grid gap-2">
              <Label>Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxGuests">Max personnes</Label>
              <Input id="maxGuests" name="maxGuests" type="number" defaultValue={2} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="beds">Lits</Label>
              <Input id="beds" name="beds" type="number" defaultValue={1} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bathrooms">Salles de bain</Label>
              <Input id="bathrooms" name="bathrooms" type="number" defaultValue={1} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sizeSqm">Surface (m²)</Label>
              <Input id="sizeSqm" name="sizeSqm" type="number" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Image principale & équipements</h2>
          <div className="grid gap-2">
            <Label>Image de couverture</Label>
            <ImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder="rooms"
            />
          </div>
          <div className="grid gap-2">
            <Label>Équipements</Label>
            <AmenitiesInput
              value={amenities}
              onChange={setAmenities}
              suggestions={["Bureau", "Assise ergonomique", "Literie de qualité", "Salle de bain aménagée", "Wi-Fi gratuit", "Salle de sport", "Piscine"]}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg">Galerie média</h2>
              <p className="text-xs text-muted-foreground">
                Ajoutez des photos et vidéos. Elles seront attachées à la chambre après création.
              </p>
            </div>
            {pendingMedia.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {pendingMedia.length} en attente
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingMedia}
              onChange={(e) => {
                if (e.target.files?.length) handleGalleryFiles(e.target.files);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingMedia}
              onClick={() => galleryFileRef.current?.click()}
              className="gap-2"
            >
              {uploadingMedia ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {uploadingMedia ? "Téléversement..." : "Ajouter des images"}
            </Button>

            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <Youtube className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="URL YouTube"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!youtubeUrl.trim()}
                onClick={addYoutubePending}
              >
                Ajouter
              </Button>
            </div>
          </div>

          {pendingMedia.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Aucun média. Ajoutez des images ou vidéos ci-dessus.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pendingMedia.map((m) => (
                <div
                  key={m.localId}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="aspect-video bg-muted relative">
                    {m.type === "IMAGE" ? (
                      <img src={m.url} alt={m.title ?? ""} className="h-full w-full object-cover" />
                    ) : (() => {
                      const ytId = parseYoutubeId(m.url);
                      return ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={m.title ?? "YouTube video"}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                          <Youtube className="h-6 w-6 mr-2" />
                          <span className="truncate">URL invalide</span>
                        </div>
                      );
                    })()}
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] uppercase px-2 py-0.5 rounded">
                      {m.type === "VIDEO" ? "Vidéo" : "Image"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePending(m.localId)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive/90 text-white grid place-items-center hover:bg-destructive opacity-0 group-hover:opacity-100 transition"
                      aria-label="Retirer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-2 text-xs truncate">{m.title || "Sans titre"}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Politiques et conditions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="checkInStart">Heure d'arrivée</Label>
              <Input
                id="checkInStart"
                type="time"
                value={checkInStart}
                onChange={(e) => setCheckInStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkInEnd">Fin d'arrivée</Label>
              <Input
                id="checkInEnd"
                type="time"
                value={checkInEnd}
                onChange={(e) => setCheckInEnd(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkOutTime">Heure de départ</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkInMethod">Conditions</Label>
              <Input
                id="checkInMethod"
                value={checkInMethod}
                onChange={(e) => setCheckInMethod(e.target.value)}
                placeholder="Arrivée autonome avec clavier"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cancellationPolicy">Politique d'annulation</Label>
            <Textarea
              id="cancellationPolicy"
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              placeholder="Annulation gratuite avant 7 jours, 50% de remboursement avant 3 jours"
              rows={2}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Publication</h2>
          <div className="flex items-center gap-2">
            <Switch id="isPublished" name="isPublished" defaultChecked />
            <Label htmlFor="isPublished">Publier immédiatement</Label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/admin-rooms")}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.loading}>
            {create.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer la chambre
          </Button>
        </div>
      </form>
    </div>
  );
}
