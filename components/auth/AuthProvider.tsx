"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, configureApi } from "@/lib/api-client";

export type UserRole = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export interface PublicUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: string | null;
  phoneVerified: string | null;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: PublicUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: PublicUser }>("/api/auth/me", { cache: "no-store" });
      setUser(data.user ?? null);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        // erreur réseau silencieuse
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    setUser(null);
  }, []);

  // Branche le client API : redirige vers déconnexion si 401 persiste après refresh
  useEffect(() => {
    configureApi({ onUnauthorized: () => setUser(null) });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, logout, setUser }),
    [user, loading, refresh, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
