// Secret de signature des JWT, partagé par le middleware (edge) et le serveur.
// En production, l'absence de AUTH_JWT_SECRET est une erreur : on refuse de
// signer ou vérifier des jetons avec une valeur par défaut connue de tous.

const DEV_FALLBACK = "dev-insecure-secret-change-me-please-32chars!!";

export function getJwtSecret(): string {
  const value = process.env.AUTH_JWT_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] AUTH_JWT_SECRET manquant : impossible de signer les sessions en production.",
    );
  }
  return value || DEV_FALLBACK;
}
