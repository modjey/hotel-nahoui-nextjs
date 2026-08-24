"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  BedDouble,
  Tag,
  CalendarCheck,
  Star,
  Users,
  UtensilsCrossed,
  Image as ImageIcon,
  Images,
  Settings,
  CreditCard,
  Newspaper,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/admin-locations", label: "Localisations", icon: MapPin },
  { href: "/admin/admin-room-types", label: "Types de chambre", icon: Tag },
  { href: "/admin/admin-rooms", label: "Chambres", icon: BedDouble },
  { href: "/admin/bookings", label: "Réservations", icon: CalendarCheck },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/reviews", label: "Avis", icon: Star },
  { href: "/admin/admin-dishes", label: "Plats", icon: UtensilsCrossed },
  { href: "/admin/admin-dish-categories", label: "Catégories de plats", icon: Tag },
  { href: "/admin/admin-photo-albums", label: "Albums photo", icon: Images },
  { href: "/admin/admin-photos", label: "Photos", icon: ImageIcon },
  { href: "/admin/blog-posts", label: "Articles de blog", icon: Newspaper },
  { href: "/admin/contact-submissions", label: "Messages de contact", icon: MessageSquare },
  { href: "/admin/media", label: "Médias", icon: ImageIcon },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <img src="/logo.png" alt="Hôtel Nahoui" className="h-10 w-auto" />
          <span className="font-display text-base leading-tight">
            Nahoui<br />
            <span className="text-xs text-muted-foreground font-sans">Administration</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href, it.exact);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
