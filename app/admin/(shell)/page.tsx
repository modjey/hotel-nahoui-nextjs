"use client";
import { PageHeader } from "@/components/admin/PageHeader";
import { useApi } from "@/hooks/use-api";
import { MapPin, BedDouble, Tag, Users, ImageIcon, Loader2, Plus, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Stats = {
  locations: { total: number; published: number };
  rooms: { total: number; published: number };
  roomTypes: number;
  users: number;
  media: number;
  bookings: { total: number; pending: number; confirmed: number };
  payments: { total: number; success: number; pending: number };
};

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi<{ stats: Stats }>("/api/admin/stats");

  const stats = data?.stats;

  const cards = stats
    ? [
        {
          label: "Localisations",
          value: stats.locations.total.toString(),
          sub: `${stats.locations.published} publiée${stats.locations.published > 1 ? "s" : ""}`,
          icon: MapPin,
          href: "/admin/admin-locations",
        },
        {
          label: "Chambres",
          value: stats.rooms.total.toString(),
          sub: `${stats.rooms.published} publiée${stats.rooms.published > 1 ? "s" : ""}`,
          icon: BedDouble,
          href: "/admin/admin-rooms",
        },
        {
          label: "Types de chambre",
          value: stats.roomTypes.toString(),
          sub: "catégories",
          icon: Tag,
          href: "/admin/admin-room-types",
        },
        {
          label: "Utilisateurs",
          value: stats.users.toString(),
          sub: `${stats.media} médias`,
          icon: Users,
          href: "/admin/users",
        },
        {
          label: "Réservations",
          value: stats.bookings.total.toString(),
          sub: `${stats.bookings.confirmed} confirmée${stats.bookings.confirmed > 1 ? "s" : ""}`,
          icon: Calendar,
          href: "/admin/bookings",
        },
        {
          label: "Paiements",
          value: stats.payments.total.toString(),
          sub: `${stats.payments.success} réussi${stats.payments.success > 1 ? "s" : ""}`,
          icon: CreditCard,
          href: "/admin/payments",
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble du catalogue de l'hôtel."
      />

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive p-4 text-sm">
          Erreur de chargement des statistiques.
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-card)] hover:border-primary/50 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl">{s.value}</span>
                    <span className="text-xs text-muted-foreground">{s.sub}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Link href="/admin/admin-locations">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" /> Nouvelle localisation
                  </Button>
                </Link>
                <Link href="/admin/admin-room-types">
                  <Button variant="outline" className="w-full justify-start gap-2 mt-3">
                    <Plus className="h-4 w-4" /> Nouveau type de chambre
                  </Button>
                </Link>
                <Link href="/admin/admin-rooms">
                  <Button variant="outline" className="w-full justify-start gap-2 mt-3">
                    <Plus className="h-4 w-4" /> Nouvelle chambre
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl mb-4">État du catalogue</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Localisations publiées
                  </span>
                  <span className="font-medium">
                    {stats.locations.published} / {stats.locations.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BedDouble className="h-4 w-4" /> Chambres publiées
                  </span>
                  <span className="font-medium">
                    {stats.rooms.published} / {stats.rooms.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Médias en bibliothèque
                  </span>
                  <span className="font-medium">{stats.media}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
