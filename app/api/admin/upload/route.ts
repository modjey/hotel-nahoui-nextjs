import { ok, fail, withAuth } from "@/lib/auth/api";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

const handler = withAuth(async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");

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

  const folderRaw = (form.get("folder") as string | null) ?? "general";
  const folder = folderRaw.replace(/[^a-z0-9-_]/gi, "").slice(0, 32) || "general";

  const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const filename = `${randomUUID()}.${ext}`;

  const uploadDir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  const url = `/uploads/${folder}/${filename}`;
  return ok({
    url,
    name: file.name,
    size: file.size,
    type: file.type,
  });
});

export { handler as POST };
