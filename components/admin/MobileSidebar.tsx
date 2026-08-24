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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname() ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <img src="/logo.png" alt="Hôtel Nahoui" className="h-10 w-auto" />
              <div className="font-display text-base leading-tight">
                Nahoui
                <span className="block text-xs text-muted-foreground font-sans">Administration</span>
              </div>
            </SheetTitle>
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href, it.exact);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
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
      </SheetContent>
    </Sheet>
  );
}
