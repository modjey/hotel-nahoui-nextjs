"use client";
import { Search, Menu } from "lucide-react";
import { useState } from "react";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationBell } from "./NotificationBell";

export function Topbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">
          <button
            className="lg:hidden h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-secondary/60 border border-transparent focus:bg-background focus:border-border focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="flex items-center gap-3 pl-3 pr-1 h-10 rounded-full border border-border">
            <span className="text-sm font-medium">Admin</span>
            <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-medium">
              A
            </span>
          </div>
        </div>
      </div>
    </header>
    <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
