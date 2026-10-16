import { join } from "node:path";

/**
 * Répertoire de stockage des fichiers uploadés.
 * Hors de `public/` : en production les fichiers écrits au runtime dans
 * `public/` ne sont pas garantis d'être servis (cwd, rebuild, artefacts
 * déployés). Configurable via UPLOAD_DIR (chemin absolu recommandé sur le VPS).
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), "uploads");

/** Ancien emplacement (`public/uploads`) — conservé pour les fichiers existants. */
export const LEGACY_UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export const UPLOAD_MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};
