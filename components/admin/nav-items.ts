import {
  LayoutDashboard,
  Bell,
  MapPin,
  BedDouble,
  CalendarCheck,
  CalendarX,
  Star,
  Users,
  UtensilsCrossed,
  Image as ImageIcon,
  Images,
  Settings,
  CreditCard,
  Newspaper,
  MessageSquare,
  BadgePercent,
  PartyPopper,
  Waves,
  TrendingUp,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
export type NavGroup = { title?: string; items: NavItem[] };

/** Navigation de l'admin, partagée par la barre latérale et le menu mobile. */
export const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Réservations",
    items: [
      { href: "/admin/bookings", label: "Réservations", icon: CalendarCheck },
      { href: "/admin/payments", label: "Paiements", icon: CreditCard },
      { href: "/admin/quotes", label: "Devis groupes & séminaires", icon: Briefcase },
      { href: "/admin/contact-submissions", label: "Messages & réclamations", icon: MessageSquare },
      { href: "/admin/reviews", label: "Avis", icon: Star },
    ],
  },
  {
    title: "Chambres & tarifs",
    items: [
      { href: "/admin/admin-rooms", label: "Chambres & types", icon: BedDouble },
      { href: "/admin/seasonal-rates", label: "Tarifs saisonniers", icon: TrendingUp },
      { href: "/admin/closures", label: "Fermetures de chambres", icon: CalendarX },
      { href: "/admin/admin-locations", label: "Localisations", icon: MapPin },
    ],
  },
  {
    title: "Site & marketing",
    items: [
      { href: "/admin/offers", label: "Offres & promotions", icon: BadgePercent },
      { href: "/admin/events", label: "Événements", icon: PartyPopper },
      { href: "/admin/facilities", label: "Espaces (piscine, salles…)", icon: Waves },
      { href: "/admin/admin-dishes", label: "Plats & catégories", icon: UtensilsCrossed },
      { href: "/admin/blog-posts", label: "Actualités", icon: Newspaper },
      { href: "/admin/admin-photo-albums", label: "Albums photo", icon: Images },
      { href: "/admin/admin-photos", label: "Photos", icon: ImageIcon },
      { href: "/admin/media", label: "Médias", icon: ImageIcon },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

export function isNavActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}
