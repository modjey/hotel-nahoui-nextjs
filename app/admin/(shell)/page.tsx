"use client";
import { PageHeader } from "@/components/admin/PageHeader";
import { useApi } from "@/hooks/use-api";
import {
  MapPin, BedDouble, Tag, Users, ImageIcon, Loader2, Plus, Calendar, CreditCard,
  TrendingUp, Percent, LogIn, LogOut, Star, MessageSquare, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Stats = {
  locations: { total: number; published: number };
  rooms: { total: number; published: number };
  roomTypes: number;
  users: { total: number; last30d: number };
  media: number;
  bookings: {
    total: number; pending: number; confirmed: number; cancelled: number;
    completed: number; upcoming: number; checkInsToday: number; checkOutsToday: number;
  };
  payments: {
    total: number; success: number; pending: number;
    revenueTotal: number; revenueMonth: number; currency: string;
    byCurrency: { currency: string; total: number }[];
  };
  occupancyRate: number;
  reviews: { total: number; pending: number; avgRating: number };
  contacts: { total: number; new: number };
  monthly: { key: string; label: string; revenue: number; bookings: number }[];
  topRooms: { roomId: string; name: string; slug: string; bookings: number }[];
  recentBookings: {
    id: string; reference: string | null; guestName: string; roomName: string;
    checkIn: string; checkOut: string; status: string; createdAt: string;
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  Confirmées: "#2F4538",
  "En attente": "#C9A961",
  Annulées: "#C05B4D",
  Terminées: "#7A8B99",
};

const statusBadge = (status: string) =>
  status === "CONFIRMED"
    ? "bg-green-600 text-white border-green-600"
    : status === "PENDING"
    ? "bg-yellow-600 text-white border-yellow-600"
    : status === "COMPLETED"
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-red-600 text-white border-red-600";

const statusLabel = (status: string) =>
  status === "CONFIRMED" ? "Confirmée" : status === "PENDING" ? "En attente" : status === "COMPLETED" ? "Terminée" : "Annulée";

const fmtMoney = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi<{ stats: Stats }>("/api/admin/stats");
  const stats = data?.stats;

  const statusDistribution = stats
    ? [
        { name: "Confirmées", value: stats.bookings.confirmed },
        { name: "En attente", value: stats.bookings.pending },
        { name: "Annulées", value: stats.bookings.cancelled },
        { name: "Terminées", value: stats.bookings.completed },
      ].filter((s) => s.value > 0)
    : [];

  const kpis = stats
    ? [
        {
          label: "Revenu total",
          value: `${fmtMoney(stats.payments.revenueTotal)} ${stats.payments.currency}`,
          sub: `${stats.payments.success} paiement${stats.payments.success > 1 ? "s" : ""} réussi${stats.payments.success > 1 ? "s" : ""}`,
          icon: TrendingUp,
          href: "/admin/payments",
        },
        {
          label: "Revenu ce mois",
          value: `${fmtMoney(stats.payments.revenueMonth)} ${stats.payments.currency}`,
          sub: format(new Date(), "MMMM yyyy", { locale: fr }),
          icon: CreditCard,
          href: "/admin/payments",
        },
        {
          label: "Taux d'occupation",
          value: `${stats.occupancyRate}%`,
          sub: "30 prochains jours",
          icon: Percent,
          href: "/admin/bookings",
        },
        {
          label: "Réservations",
          value: stats.bookings.total.toString(),
          sub: `${stats.bookings.upcoming} à venir · ${stats.bookings.pending} en attente`,
          icon: Calendar,
          href: "/admin/bookings",
        },
        {
          label: "Arrivées aujourd'hui",
          value: stats.bookings.checkInsToday.toString(),
          sub: `${stats.bookings.checkOutsToday} départ${stats.bookings.checkOutsToday > 1 ? "s" : ""}`,
          icon: LogIn,
          href: "/admin/bookings",
        },
        {
          label: "Utilisateurs",
          value: stats.users.total.toString(),
          sub: `+${stats.users.last30d} sur 30 jours`,
          icon: Users,
          href: "/admin/users",
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité de l'hôtel."
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
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((s) => {
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
                  <div className="mt-3">
                    <span className="font-display text-2xl">{s.value}</span>
                    <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Graphiques */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-card border border-border p-6 lg:col-span-2">
              <h3 className="font-display text-xl mb-4">Revenus & réservations — 6 derniers mois</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E3D8" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="revenue"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    />
                    <YAxis yAxisId="bookings" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "revenue"
                          ? [`${fmtMoney(value)} FCFA`, "Revenus"]
                          : [value, "Réservations"]
                      }
                    />
                    <Bar yAxisId="revenue" dataKey="revenue" fill="#2F4538" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="bookings" dataKey="bookings" stroke="#C9A961" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl mb-4">Statuts des réservations</h3>
              {statusDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Aucune réservation</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={3}
                      >
                        {statusDistribution.map((s) => (
                          <Cell key={s.name} fill={STATUS_COLORS[s.name] || "#999"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 3 : top chambres, avis, contacts */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl mb-4">Top chambres</h3>
              {stats.topRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topRooms.map((r, i) => (
                    <Link
                      key={r.roomId}
                      href={r.slug ? `/admin/admin-rooms/${r.slug}/bookings` : "/admin/bookings"}
                      className="flex items-center gap-3 group"
                    >
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium group-hover:underline truncate">
                        {r.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.bookings} résa{r.bookings > 1 ? "s" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl mb-4">Avis clients</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" /> Note moyenne
                  </span>
                  <span className="font-medium">{stats.reviews.avgRating || "—"} / 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total des avis</span>
                  <span className="font-medium">{stats.reviews.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">En attente de modération</span>
                  <Badge className={stats.reviews.pending > 0 ? "bg-yellow-600 text-white" : ""}>
                    {stats.reviews.pending}
                  </Badge>
                </div>
                {stats.reviews.pending > 0 && (
                  <Link href="/admin/reviews" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Modérer les avis <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="font-display text-xl mb-4">Messages & activité</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Messages non lus
                  </span>
                  <Badge className={stats.contacts.new > 0 ? "bg-yellow-600 text-white" : ""}>
                    {stats.contacts.new}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Arrivées aujourd&apos;hui
                  </span>
                  <span className="font-medium">{stats.bookings.checkInsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Départs aujourd&apos;hui
                  </span>
                  <span className="font-medium">{stats.bookings.checkOutsToday}</span>
                </div>
                {stats.contacts.new > 0 && (
                  <Link href="/admin/contact-submissions" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Voir les messages <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Row 4 : dernières réservations + actions + catalogue */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-card border border-border p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl">Dernières réservations</h3>
                <Link href="/admin/bookings" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Tout voir <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {stats.recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune réservation.</p>
              ) : (
                <div className="divide-y divide-border">
                  {stats.recentBookings.map((b) => (
                    <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between py-3 group">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate group-hover:underline">
                          {b.guestName} — {b.roomName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(b.checkIn), "dd MMM", { locale: fr })} → {format(new Date(b.checkOut), "dd MMM yyyy", { locale: fr })}
                          {b.reference ? ` · ${b.reference}` : ""}
                        </div>
                      </div>
                      <Badge className={statusBadge(b.status)}>{statusLabel(b.status)}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-card border border-border p-6">
                <h3 className="font-display text-xl mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <Link href="/admin/bookings">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" /> Nouvelle réservation
                    </Button>
                  </Link>
                  <Link href="/admin/admin-rooms">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" /> Nouvelle chambre
                    </Button>
                  </Link>
                  <Link href="/admin/admin-locations">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" /> Nouvelle localisation
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
                      <Tag className="h-4 w-4" /> Types de chambre
                    </span>
                    <span className="font-medium">{stats.roomTypes}</span>
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
          </div>
        </>
      )}
    </div>
  );
}
