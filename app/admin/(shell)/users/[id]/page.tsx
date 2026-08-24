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
import { ArrowLeft, Mail, Phone, Calendar, MapPin, User, Shield, Power, BedDouble } from "lucide-react";

type Booking = {
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
  room: {
    id: string;
    name: string;
    slug: string;
    coverImageUrl: string | null;
  };
};

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  accounts: Array<{ id: string; provider: string }>;
  sessions: Array<{ id: string; createdAt: string }>;
  bookings: Booking[];
  userLocations?: Array<{
    location: {
      id: string;
      name: string;
      city: string | null;
    };
  }>;
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading, error, refetch } = useApi<UserData>(`/api/admin/admin-users/${id}`);

  const toggleActive = async () => {
    if (!data) return;
    try {
      await api.patch(`/api/admin/admin-users/${id}`, { isActive: !data.isActive });
      toast.success(data.isActive ? "Désactivé" : "Activé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Utilisateur" />
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Utilisateur" />
        <div className="text-center py-8 text-destructive">Erreur de chargement</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={data.name || "Utilisateur"}
        description="Informations personnelles et historique des réservations."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/users">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <Button
              variant={data.isActive ? "destructive" : "default"}
              onClick={toggleActive}
            >
              <Power className="h-4 w-4 mr-2" />
              {data.isActive ? "Désactiver" : "Activer"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations personnelles
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{data.email || "Non renseigné"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{data.phone || "Non renseigné"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant={data.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                  {data.role}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Membre depuis {format(new Date(data.createdAt), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>
          </div>

          {data.userLocations && data.userLocations.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localisations
              </h3>
              <div className="space-y-2">
                {data.userLocations.map((ul) => (
                  <div key={ul.location.id} className="text-sm">
                    {ul.location.name}
                    {ul.location.city && `, ${ul.location.city}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4">Statut du compte</h3>
            <Badge variant={data.isActive ? "default" : "secondary"} className="w-full justify-center">
              {data.isActive ? "Actif" : "Inactif"}
            </Badge>
          </div>
        </div>

        {/* Réservations */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Réservations ({data.bookings.length})
            </h3>
            {data.bookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune réservation</p>
            ) : (
              <div className="space-y-4">
                {data.bookings.map((b) => (
                  <div key={b.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{b.room.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(b.checkIn), "dd MMM yyyy", { locale: fr })} → {format(new Date(b.checkOut), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </div>
                      <Badge variant={b.status === "CONFIRMED" ? "default" : "secondary"}>
                        {b.status === "CONFIRMED" ? "Confirmé" : b.status === "PENDING" ? "En attente" : b.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Voyageurs :</span> {b.adults} adulte{b.adults > 1 ? "s" : ""} · {b.children} enfant{b.children > 1 ? "s" : ""}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Réf :</span> {b.reference || "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.payment?.status === "SUCCESS" && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Payé
                        </Badge>
                      )}
                      <Link href={`/admin/admin-rooms/${b.room.slug}`} className="text-sm text-primary hover:underline">
                        Voir la chambre
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
