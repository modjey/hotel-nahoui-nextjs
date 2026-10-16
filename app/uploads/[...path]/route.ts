import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import {
  LEGACY_UPLOAD_DIR,
  UPLOAD_DIR,
  UPLOAD_MIME_BY_EXT,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert les fichiers uploadés depuis UPLOAD_DIR (nouveaux fichiers), avec
 * repli sur public/uploads pour les fichiers existants. Les URLs publiques
 * restent /uploads/<dossier>/<fichier>.
 */
async function resolveFile(segments: string[]): Promise<string | null> {
  const rel = segments.join("/");
  if (!rel || rel.includes("..") || rel.includes("\\")) return null;

  for (const base of [UPLOAD_DIR, LEGACY_UPLOAD_DIR]) {
    const root = resolve(base);
    const abs = resolve(root, rel);
    if (!abs.startsWith(root + sep)) continue;
    try {
      const info = await stat(abs);
      if (info.isFile()) return abs;
    } catch {
      // n'existe pas dans ce dossier : essayer le suivant
    }
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const file = await resolveFile(path ?? []);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const info = await stat(file);
  const type =
    UPLOAD_MIME_BY_EXT[extname(file).toLowerCase()] ??
    "application/octet-stream";

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
