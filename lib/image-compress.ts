const MAX_DIMENSION = 2048;
const TARGET_TYPE = "image/webp";
const QUALITY = 0.82;
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

/**
 * Compresse une image côté client (canvas) : redimensionne à max 2048px
 * et convertit en WebP ~82%. Retourne le fichier original si la compression
 * échoue ou n'est pas pertinente (GIF animé, SVG, gain nul).
 */
export async function compressImage(file: File): Promise<File> {
  if (SKIP_TYPES.has(file.type) || !file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, TARGET_TYPE, QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.webp`, { type: TARGET_TYPE });
  } catch {
    return file;
  }
}
