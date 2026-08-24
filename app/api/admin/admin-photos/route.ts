import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, parseBody } from "@/lib/auth/api";
import { slugify } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Schema for creating a photo
const createPhotoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  albumId: z.string(),
  isApproved: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  order: z.number().default(0),
  uploadedBy: z.string().optional(),
});

// Schema for updating a photo
const updatePhotoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().optional(),
});

// Helper function to save uploaded file
async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), "public", folder);
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
  const filepath = join(uploadsDir, filename);
  
  await writeFile(filepath, buffer);
  
  return `/${folder}/${filename}`;
}

// GET /api/admin/admin-photos - List all photos (admin only)
export const GET = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get("albumId");
  const isApproved = searchParams.get("isApproved");
  const isFeatured = searchParams.get("isFeatured");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  const where: any = {};
  if (albumId) where.albumId = albumId;
  if (isApproved !== null && isApproved !== undefined && isApproved !== "") {
    where.isApproved = isApproved === "true";
  }
  if (isFeatured !== null && isFeatured !== undefined && isFeatured !== "") {
    where.isFeatured = isFeatured === "true";
  }

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: {
        album: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.photo.count({ where }),
  ]);

  return ok({ photos, total, page, limit, totalPages: Math.ceil(total / limit) });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// POST /api/admin/admin-photos - Create a new photo with upload (admin only)
export const POST = withAuth(async (req, { session }) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const albumId = formData.get("albumId") as string;
    const isApproved = formData.get("isApproved") === "true";
    const isFeatured = formData.get("isFeatured") === "true";
    const order = parseInt(formData.get("order") as string || "0");
    const uploadedBy = formData.get("uploadedBy") as string | null;

    if (!file) {
      return fail("Fichier image manquant", 400, "MISSING_FILE");
    }

    if (!albumId) {
      return fail("Album ID manquant", 400, "MISSING_ALBUM");
    }

    // Verify album exists
    const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
    if (!album) {
      return fail("Album non trouvé", 404, "ALBUM_NOT_FOUND");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return fail("Type de fichier non supporté", 400, "INVALID_FILE_TYPE");
    }

    // Save file
    const imageUrl = await saveUploadedFile(file, "uploads/photos");

    // Generate slug from title or filename
    const slug = slugify(title || file.name.replace(/\.[^/.]+$/, ""));

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        slug,
        title: title || null,
        description: description || null,
        imageUrl,
        albumId,
        isApproved,
        isFeatured,
        order,
        uploadedBy: uploadedBy || null,
        sizeBytes: file.size,
      },
    });

    return ok(photo, { status: 201 });
  } catch (error) {
    console.error("Photo upload error:", error);
    return fail("Erreur lors de l'upload", 500, "UPLOAD_ERROR");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
