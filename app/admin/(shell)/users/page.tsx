"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Role } from "@prisma/client";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  image: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  createdAt: string;
  userLocations?: { id: string; locationId: string; location: { id: string; name: string; city: string | null } }[];
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const roleLabels: Record<Role, string> = {
  USER: "Utilisateur",
  MODERATOR: "Modérateur",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const roleColors: Record<Role, string> = {
  USER: "default",
  MODERATOR: "secondary",
  ADMIN: "outline",
  SUPER_ADMIN: "destructive",
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [locations, setLocations] = useState<{ id: string; name: string; city: string | null }[]>([]);
  
  // Create/Edit dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    name: "",
    password: "",
    role: "USER" as Role,
    isActive: true,
    locationIds: [] as string[],
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UsersResponse>("/api/admin/admin-users", {
        params: {
          page: page.toString(),
          limit: "10",
          search: search || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
          isActive: isActiveFilter !== "all" ? isActiveFilter : undefined,
        },
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, isActiveFilter]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await api.get<{ locations: { id: string; name: string; city: string | null }[] }>("/api/admin/admin-locations");
      setLocations(response.locations);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchUsers();
      fetchLocations();
    }, 0);
  }, [fetchUsers, fetchLocations]);

  const handleCreateUser = async () => {
    try {
      await api.post("/api/admin/admin-users", formData);
      setIsCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert(error instanceof ApiError ? error.message : "Erreur lors de la création");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/api/admin/admin-users/${editingUser.id}`, formData);
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert(error instanceof ApiError ? error.message : "Erreur lors de la mise à jour");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await api.del(`/api/admin/admin-users/${deletingUser.id}`);
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(error instanceof ApiError ? error.message : "Erreur lors de la suppression");
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email || "",
      phone: user.phone || "",
      name: user.name || "",
      password: "",
      role: user.role,
      isActive: user.isActive,
      locationIds: user.userLocations?.map(ul => ul.locationId) || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      phone: "",
      name: "",
      password: "",
      role: "USER",
      isActive: true,
      locationIds: [],
    });
  };

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gérez les comptes clients et l'équipe administrative."
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un utilisateur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouvel utilisateur au système.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive">Actif</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="locations">Localités (pour admins/modérateurs)</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {locations.map((loc) => (
                      <div key={loc.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`loc-${loc.id}`}
                          checked={formData.locationIds.includes(loc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, locationIds: [...formData.locationIds, loc.id] });
                            } else {
                              setFormData({ ...formData, locationIds: formData.locationIds.filter(id => id !== loc.id) });
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`loc-${loc.id}`} className="text-sm cursor-pointer">
                          {loc.name} {loc.city && `(${loc.city})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateUser}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email, nom, téléphone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(roleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={isActiveFilter} onValueChange={(value) => { setIsActiveFilter(value); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="true">Actif</SelectItem>
              <SelectItem value="false">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || "Avatar"}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            {user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <Link href={`/admin/users/${user.id}`} className="hover:underline">
                          {user.name || "N/A"}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || "N/A"}</TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={`${
                        user.role === "USER" 
                          ? "bg-gray-600 text-white border-gray-600" 
                          : user.role === "MODERATOR" 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : user.role === "ADMIN" 
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-red-600 text-white border-red-600"
                      }`}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${
                        user.isActive 
                          ? "bg-green-600 text-white border-green-600" 
                          : "bg-red-600 text-white border-red-600"
                      }`}>
                        {user.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {totalPages > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Mot de passe (laisser vide pour ne pas changer)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-isActive">Actif</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-locations">Localités (pour admins/modérateurs)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`edit-loc-${loc.id}`}
                      checked={formData.locationIds.includes(loc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, locationIds: [...formData.locationIds, loc.id] });
                        } else {
                          setFormData({ ...formData, locationIds: formData.locationIds.filter(id => id !== loc.id) });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`edit-loc-${loc.id}`} className="text-sm cursor-pointer">
                      {loc.name} {loc.city && `(${loc.city})`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur {deletingUser?.name || deletingUser?.email} ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
