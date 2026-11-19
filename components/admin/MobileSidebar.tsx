"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isNavActive } from "@/components/admin/nav-items";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";


interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname() ?? "";


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

        <nav className="flex-1 overflow-y-auto px-3 py-4 ">
          {ADMIN_NAV.map((group, gi) => (
            <div key={gi} className={cn("space-y-0.5", gi > 0 && "pt-4")}>
              {group.title && (
                <div className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.title}</div>
              )}
              {group.items.map((it) => {
                const Icon = it.icon;
                const active = isNavActive(pathname, it.href, it.exact);
                return (
                  <Link
                    key={it.href}
                    href={it.href} onClick={handleLinkClick}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
