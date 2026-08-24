"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Search, User, Power, Eye } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    sessions: number;
    accounts: number;
  };
};

export default function AdminUsersPage() {
  const { data, loading, error, refetch } = useApi<{ users: User[] }>("/api/admin/admin-users");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/admin-users/${id}`, { isActive: !currentStatus });
      toast.success(currentStatus ? "Désactivé" : "Activé");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const filtered = (data?.users ?? []).filter((u) =>
    search
      ? [u.name, u.email, u.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gérez les utilisateurs et leurs comptes."
      />

      <div className="rounded-2xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-destructive">
                  Erreur de chargement
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <span>{u.name || "Sans nom"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u._count.sessions}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/admin-users/${u.id}`)}
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(u.id, u.isActive)}
                        title={u.isActive ? "Désactiver" : "Activer"}
                      >
                        <Power className={`h-4 w-4 ${u.isActive ? "text-foreground" : "text-muted-foreground"}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
