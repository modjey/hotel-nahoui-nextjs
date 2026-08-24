"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { ArrowLeft, Edit, BedDouble, MapPin, Users, Calendar, CreditCard, Power } from "lucide-react";

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
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  }>;
};

export default function AdminRoomViewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { data, loading, error, refetch } = useApi<{ room: Room }>(`/api/admin/admin-rooms/${slug}`);

  const togglePublish = async () => {
    if (!data) return;
    try {
      await api.patch(`/api/admin/admin-rooms/${slug}`, { isPublished: !data.room.isPublished });
      toast.success(data.room.isPublished ? "Désactivée" : "Activée");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Chambre" />
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Chambre" />
        <div className="text-center py-8 text-destructive">Erreur de chargement</div>
      </div>
    );
  }

  const room = data.room;

  return (
    <div>
      <PageHeader
        title={room.name}
        description="Détails complets de la chambre et historique des réservations."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/admin-rooms">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <Link href={`/admin/admin-rooms/${room.slug}`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </Link>
            <Button
              variant={room.isPublished ? "destructive" : "default"}
              onClick={togglePublish}
            >
              <Power className="h-4 w-4 mr-2" />
              {room.isPublished ? "Désactiver" : "Activer"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Informations générales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Nom</div>
                <div className="font-medium">{room.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Numéro de chambre</div>
                <div className="font-medium">{room.roomNumber || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{room.roomType.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Localisation</div>
                <div className="font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {room.location.name}
                  {room.location.city && `, ${room.location.city}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Statut</div>
                <Badge variant={room.isPublished ? "default" : "secondary"} className="mt-1">
                  {room.isPublished ? "Publiée" : "Brouillon"}
                </Badge>
              </div>
            </div>
            {room.shortDescription && (
              <div>
                <div className="text-sm text-muted-foreground">Description courte</div>
                <div className="font-medium">{room.shortDescription}</div>
              </div>
            )}
            {room.description && (
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="font-medium whitespace-pre-wrap">{room.description}</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Tarif & capacité
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Prix de base</div>
                <div className="font-display text-xl">
                  {new Intl.NumberFormat("fr-FR").format(room.basePrice)} {room.currency}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max personnes</div>
                <div className="font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {room.maxGuests}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lits</div>
                <div className="font-medium">{room.beds}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Salles de bain</div>
                <div className="font-medium">{room.bathrooms}</div>
              </div>
            </div>
            {room.sizeSqm && (
              <div>
                <div className="text-sm text-muted-foreground">Surface</div>
                <div className="font-medium">{room.sizeSqm} m²</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="font-semibold">Équipements</h3>
            <div className="flex flex-wrap gap-2">
              {room.amenities.length === 0 ? (
                <p className="text-muted-foreground">Aucun équipement</p>
              ) : (
                room.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Politiques et conditions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Heure d&apos;arrivée</div>
                <div className="font-medium">{room.checkInStart || "N/A"} - {room.checkInEnd || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Heure de départ</div>
                <div className="font-medium">{room.checkOutTime || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Conditions</div>
                <div className="font-medium">{room.checkInMethod || "N/A"}</div>
              </div>
            </div>
            {room.cancellationPolicy && (
              <div>
                <div className="text-sm text-muted-foreground">Politique d&apos;annulation</div>
                <div className="font-medium">{room.cancellationPolicy}</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Historique des réservations ({room.bookings.length})
            </h3>
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
                              {b.user?.name || b.guestFirstName} {b.guestLastName}
                            </Link>
                          ) : (
                            <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                              {b.user?.name || b.guestFirstName} {b.guestLastName}
                            </Link>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {b.user?.email || b.guestEmail}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {b.user?.phone || b.guestPhone}
                        </div>
                      </div>
                      <Badge className={
                        b.status === "CONFIRMED" 
                          ? "bg-green-600 text-white border-green-600" 
                          : b.status === "PENDING" 
                          ? "bg-yellow-600 text-white border-yellow-600" 
                          : "bg-red-600 text-white border-red-600"
                      }>
                        {b.status === "CONFIRMED" ? "Confirmé" : b.status === "PENDING" ? "En attente" : "Annulé"}
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {room.coverImageUrl && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-semibold mb-4">Image de couverture</h3>
              <img
                src={room.coverImageUrl}
                alt={room.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link href={`/admin/admin-rooms/${room.slug}`}>
                <Button className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
              <Button
                variant={room.isPublished ? "destructive" : "default"}
                className="w-full"
                onClick={togglePublish}
              >
                <Power className="h-4 w-4 mr-2" />
                {room.isPublished ? "Désactiver" : "Activer"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
