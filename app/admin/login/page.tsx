"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type PublicUser } from "@/components/auth/AuthProvider";
import { api, ApiError } from "@/lib/api-client";

function AdminLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.post<{ user: PublicUser }>("/api/auth/password-login", {
        email,
        password,
      });
      const role = data.user?.role;
      if (!role || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(role)) {
        toast.error("Accès réservé à l'administration");
        await api.post("/api/auth/logout").catch(() => {});
        return;
      }
      await refresh();
      const dest = params.get("from") ?? "/admin";
      router.push(dest);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-[var(--shadow-elevated)] p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl">Espace administrateur</h1>
            <p className="text-xs text-muted-foreground">Hôtel Nahoui</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@hotelnahoui.ci"
              className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={submitting}
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Se connecter
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center bg-secondary/40 px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
