"use client";

import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { PERMISSIONS, ROLES, SECURITY_RULES } from "@/lib/role-permissions";

export default function RolesPage() {
  const { user } = useAuth();
  const myRole = user?.role;

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Rôles & permissions"
        description="Ce que chaque rôle peut voir et faire. Le rôle d'un compte se change dans Utilisateurs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <div
            key={r.key}
            className={cn(
              "rounded-2xl border bg-card p-5",
              myRole === r.key ? "border-primary ring-1 ring-primary/30" : "border-border",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl">{r.label}</h2>
              {myRole === r.key && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Votre rôle</span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.summary}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[44rem] text-sm">
          <caption className="sr-only">Permissions par rôle</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="px-5 py-3 font-semibold">Section</th>
              {ROLES.map((r) => (
                <th
                  key={r.key}
                  scope="col"
                  className={cn("px-3 py-3 text-center font-semibold w-28", myRole === r.key && "bg-primary/5 text-primary")}
                >
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          {PERMISSIONS.map((group) => (
            <tbody key={group.title}>
              <tr className="bg-secondary/50">
                <th colSpan={ROLES.length + 1} scope="colgroup" className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.area} className="border-t border-border">
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <div className="font-medium">{row.area}</div>
                    <div className="text-xs text-muted-foreground">{row.detail}</div>
                  </th>
                  {ROLES.map((r) => {
                    const allowed = row.roles.includes(r.key);
                    return (
                      <td key={r.key} className={cn("px-3 py-3 text-center", myRole === r.key && "bg-primary/5")}>
                        {allowed ? (
                          <Check className="mx-auto h-4 w-4 text-green-600" aria-label="Autorisé" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Non autorisé" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Règles de sécurité</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {SECURITY_RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
