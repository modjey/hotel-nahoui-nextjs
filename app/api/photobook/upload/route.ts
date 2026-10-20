import { NextRequest } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOAD_DIR } from "@/lib/uploads";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { ok, fail } from "@/lib/auth/api";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

// POST /api/photobook/upload - Téléversement public pour les soumissions du photobook
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`photobook-upload:${clientKey(req.headers)}`, 10, 15 * 60 * 1000);
    if (!rl.ok) {
      return fail("Trop de téléversements, réessayez plus tard", 429, "RATE_LIMITED");
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return fail("Body multipart invalide", 400, "BAD_FORM_DATA");
    }

    const file = form.get("file");
    if (!(file instanceof File)) return fail("Fichier manquant", 400, "MISSING_FILE");

    if (!ALLOWED_MIME.has(file.type)) {
      return fail(`Type non autorisé: ${file.type}`, 415, "UNSUPPORTED_TYPE");
    }
    if (file.size > MAX_SIZE) {
      return fail("Fichier trop volumineux (max 8 Mo)", 413, "FILE_TOO_LARGE");
    }

    const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const filename = `${randomUUID()}.${ext}`;

    const uploadDir = join(UPLOAD_DIR, "photos");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    return ok({ url: `/uploads/photos/${filename}` });
  } catch (error) {
    console.error("Error uploading photobook photo:", error);
    return fail("Erreur lors du téléversement", 500);
  }
}
