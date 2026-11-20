"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navForRole, isNavActive } from "@/components/admin/nav-items";
import { useAuth } from "@/components/auth/AuthProvider";


export function Sidebar() {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const nav = navForRole(user?.role);


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

      <nav className="flex-1 overflow-y-auto px-3 py-4 ">
        {nav.map((group, gi) => (
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
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
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

    </aside>
  );
}
