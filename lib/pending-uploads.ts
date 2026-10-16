"use client";

/**
 * Uploads différés : les composants de sélection de fichiers (ImageUpload,
 * MediaGallery) n'envoient rien au serveur à la sélection — ils affichent
 * un aperçu local (blob URL) et enregistrent ici un uploader. Le formulaire
 * appelle flushPendingUploads() dans son onSubmit : chaque fichier en attente
 * est alors téléversé et les URLs finales sont retournées, indexées par le
 * `name` du champ (pour les champs nommés comme ImageUpload).
 */

type PendingUploader = {
  /** Clé du champ de formulaire (prop `name` de ImageUpload). */
  name?: string;
  /** Envoie le fichier en attente ; retourne l'URL finale ou null. */
  flush: () => Promise<string | null>;
};

const registry = new Map<number, PendingUploader>();
let nextId = 1;

/** Enregistre un uploader ; retourne la fonction de désenregistrement. */
export function registerPendingUpload(uploader: PendingUploader): () => void {
  const id = nextId++;
  registry.set(id, uploader);
  return () => {
    registry.delete(id);
  };
}

/**
 * Exécute tous les uploads en attente (séquentiel pour préserver l'ordre).
 * Retourne `{ [name]: url }` pour les champs nommés. Propage la première
 * erreur — l'appelant doit interrompre la soumission dans ce cas.
 */
export async function flushPendingUploads(): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};
  for (const uploader of Array.from(registry.values())) {
    const url = await uploader.flush();
    if (uploader.name && url) resolved[uploader.name] = url;
  }
  return resolved;
}
