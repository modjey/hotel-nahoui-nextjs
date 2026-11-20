/**
 * Accès à l'administration selon le rôle.
 * - SUPER_ADMIN / ADMIN : toute l'administration (seul un super admin gère les comptes administrateurs).
 * - MODERATOR : messages clients, actualités et réglages du photobook uniquement
 *   (ce sont les seules API qui l'acceptent).
 */
export const MODERATOR_ADMIN_PATHS = [
  "/admin/contact-submissions",
  "/admin/blog-posts",
  "/admin/photobook-settings",
] as const;

export const MODERATOR_HOME = "/admin/contact-submissions";

export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  if (role === "MODERATOR") {
    return MODERATOR_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }
  return false;
}
