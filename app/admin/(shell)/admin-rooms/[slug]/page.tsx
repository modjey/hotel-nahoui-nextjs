"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AmenitiesInput } from "@/components/admin/AmenitiesInput";
import { MediaGallery, type MediaItem } from "@/components/admin/MediaGallery";
import { api, ApiError } from "@/lib/api-client";
import { useApi, useMutation } from "@/hooks/use-api";
import { roomUpdateSchema } from "@/lib/catalog/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, BedDouble, Calendar, Users } from "lucide-react";

type Room = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  shortDescription: string | null;
  description: string | null;
  basePrice: number;
  currency: string;
  maxGuests: number;
  beds: number;
  bathrooms: number;
  sizeSqm: number | null;
  amenities: string[];
  coverImageUrl: string | null;
  isPublished: boolean;
  order: number;
  checkInStart: string | null;
  checkInEnd: string | null;
  checkOutTime: string | null;
  checkInMethod: string | null;
  cancellationPolicy: string | null;
  location: { id: string; name: string; city: string | null };
  roomType: { id: string; name: string };
  media: MediaItem[];
  bookings: Array<{
    id: string;
    reference: string | null;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    guestFirstName: string | null;
    guestLastName: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    status: string;
    payment: { status: string | null } | null;
    userId: string | null;
  }>;
};

type LocationOption = { id: string; name: string; city: string | null };
type RoomTypeOption = { id: string; name: string };

export default function AdminRoomEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const [checkInStart, setCheckInStart] = useState("15:00");
  const [checkInEnd, setCheckInEnd] = useState("22:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [checkInMethod, setCheckInMethod] = useState("Arrivée autonome avec clavier");
  const [cancellationPolicy, setCancellationPolicy] = useState("Annulation gratuite avant 7 jours, 50% de remboursement avant 3 jours");

  const { data: locsData } = useApi<{ locations: LocationOption[] }>("/api/admin/admin-locations");
  const { data: typesData } = useApi<{ types: RoomTypeOption[] }>("/api/admin/admin-room-types");

  const loadRoom = useCallback(async () => {
    try {
      const data = await api.get<{ room: Room }>(`/api/admin/admin-rooms/${slug}`);
      setRoom(data.room);
      setCoverImageUrl(data.room.coverImageUrl ?? "");
      setAmenities(data.room.amenities ?? []);
      setLocationId(data.room.location.id);
      setRoomTypeId(data.room.roomType.id);
      setCurrency(data.room.currency);
      setCheckInStart(data.room.checkInStart ?? "15:00");
      setCheckInEnd(data.room.checkInEnd ?? "22:00");
      setCheckOutTime(data.room.checkOutTime ?? "11:00");
      setCheckInMethod(data.room.checkInMethod ?? "Arrivée autonome avec clavier");
      setCancellationPolicy(data.room.cancellationPolicy ?? "Annulation gratuite avant 7 jours, 50% de remboursement avant 3 jours");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const update = useMutation<{ room: Room }, z.infer<typeof roomUpdateSchema>>(
    `/api/admin/admin-rooms/${slug}`,
    { method: "PATCH", onSuccess: () => toast.success("Mis à jour") },
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
      basePrice: raw.basePrice ? Number(raw.basePrice) : undefined,
      maxGuests: raw.maxGuests ? Number(raw.maxGuests) : undefined,
      beds: raw.beds ? Number(raw.beds) : undefined,
      bathrooms: raw.bathrooms ? Number(raw.bathrooms) : undefined,
      sizeSqm: raw.sizeSqm ? Number(raw.sizeSqm) : null,
      checkInStart,
      checkInEnd,
      checkOutTime,
      checkInMethod,
      cancellationPolicy,
    };

    const result = roomUpdateSchema.safeParse(payload);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, msgs]) => {
        toast.error(`${field}: ${msgs?.join(", ")}`);
      });
      return;
    }

    await update.mutate(result.data);
  };

  const deleteRoom = async () => {
    if (!confirm("Supprimer cette chambre ?")) return;
    try {
      await api.del(`/api/admin/admin-rooms/${slug}`);
      toast.success("Supprimée");
      router.push("/admin/admin-rooms");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!room) return <div className="text-destructive">Chambre introuvable</div>;

  return (
    <div>
      <Link
        href="/admin/admin-rooms"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux chambres
      </Link>

      <PageHeader
        title={`Modifier ${room.name}`}
        description="Mettez à jour les informations, l&apos;image principale et la galerie média."
        actions={
          <Button type="button" variant="destructive" onClick={deleteRoom}>
            Supprimer
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Informations générales</h2>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" defaultValue={room.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="roomNumber">Numéro de chambre</Label>
            <Input id="roomNumber" name="roomNumber" defaultValue={room.roomNumber ?? ""} placeholder="Ex: 101" maxLength={50} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Localisation *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue />
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
                  <SelectValue />
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
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={room.shortDescription ?? ""}
              maxLength={280}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={room.description ?? ""}
              rows={5}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Tarif & capacité</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="basePrice">Prix de base *</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                defaultValue={room.basePrice}
                required
              />
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
              <Input
                id="maxGuests"
                name="maxGuests"
                type="number"
                defaultValue={room.maxGuests}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="beds">Lits</Label>
              <Input id="beds" name="beds" type="number" defaultValue={room.beds} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bathrooms">Salles de bain</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                defaultValue={room.bathrooms}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sizeSqm">Surface (m²)</Label>
              <Input
                id="sizeSqm"
                name="sizeSqm"
                type="number"
                defaultValue={room.sizeSqm ?? ""}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Image principale &amp; équipements</h2>
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
            <h2 className="font-display text-lg">Galerie média</h2>
            <span className="text-xs text-muted-foreground">
              {room.media.length} élément{room.media.length > 1 ? "s" : ""}
            </span>
          </div>
          <MediaGallery
            roomId={room.id}
            media={room.media}
            onChange={loadRoom}
            folder="rooms"
          />
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg">Politiques et conditions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="checkInStart">Heure d&apos;arrivée</Label>
              <Input
                id="checkInStart"
                type="time"
                value={checkInStart}
                onChange={(e) => setCheckInStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkInEnd">Fin d&apos;arrivée</Label>
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
            <Label htmlFor="cancellationPolicy">Politique d&apos;annulation</Label>
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
            <Switch id="isPublished" name="isPublished" defaultChecked={room.isPublished} />
            <Label htmlFor="isPublished">Publiée</Label>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-display text-lg flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Historique des réservations ({room.bookings.length})
          </h2>
          {room.bookings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucune réservation</p>
          ) : (
            <div className="space-y-3">
              {room.bookings.map((b) => (
                <div key={b.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {b.userId ? (
                          <Link href={`/admin/users/${b.userId}`} className="hover:underline">
                            {b.guestFirstName} {b.guestLastName}
                          </Link>
                        ) : (
                          <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                            {b.guestFirstName} {b.guestLastName}
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {b.guestEmail}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {b.guestPhone}
                      </div>
                    </div>
                    <Badge variant={b.status === "CONFIRMED" ? "default" : "secondary"}>
                      {b.status === "CONFIRMED" ? "Confirmé" : b.status === "PENDING" ? "En attente" : b.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(b.checkIn), "dd MMM yyyy", { locale: fr })} → {format(new Date(b.checkOut), "dd MMM yyyy", { locale: fr })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {b.adults} adulte{b.adults > 1 ? "s" : ""} · {b.children} enfant{b.children > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.reference ? (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Réf: <Link href={`/admin/bookings/${b.id}`} className="hover:underline ml-1">{b.reference}</Link>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Réf: N/A
                      </Badge>
                    )}
                    {b.payment?.status === "SUCCESS" && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-600">
                        Payé
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/admin-rooms")}>
            Annuler
          </Button>
          <Button type="submit" disabled={update.loading}>
            {update.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
