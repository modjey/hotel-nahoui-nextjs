import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, parseBody } from "@/lib/auth/api";
import { slugify } from "@/lib/utils";

// Schema for updating an album
const updateAlbumSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["GALLERY", "GUEST", "EVENT", "ROOM", "AMENITY"]).optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().optional(),
  locationId: z.string().optional(),
});

// GET /api/admin/admin-photo-albums/[id] - Get a single album (admin only)
export const GET = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID album manquant", 400, "MISSING_ID");
  }

  const album = await prisma.photoAlbum.findUnique({
    where: { id },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      photos: {
        orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!album) {
    return fail("Album non trouvé", 404, "NOT_FOUND");
  }

  return ok(album);
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// PUT /api/admin/admin-photo-albums/[id] - Update an album (admin only)
export const PUT = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID album manquant", 400, "MISSING_ID");
  }

  const bodyResult = await parseBody(req, updateAlbumSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { name, description, type, coverImage, isPublished, isFeatured, order, locationId } = bodyResult.data;

  // Check if album exists
  const existing = await prisma.photoAlbum.findUnique({ where: { id } });
  if (!existing) {
    return fail("Album non trouvé", 404, "NOT_FOUND");
  }

  // Update slug if name changed
  let slug = undefined;
  if (name && name !== existing.name) {
    slug = slugify(name);
    const slugExists = await prisma.photoAlbum.findUnique({ where: { slug } });
    if (slugExists) {
      return fail("Un album avec ce nom existe déjà", 409, "SLUG_EXISTS");
    }
  }

  const album = await prisma.photoAlbum.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(coverImage !== undefined && { coverImage }),
      ...(isPublished !== undefined && { isPublished }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(order !== undefined && { order }),
      ...(locationId !== undefined && { locationId }),
    },
  });

  return ok(album);
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// DELETE /api/admin/admin-photo-albums/[id] - Delete an album (admin only)
export const DELETE = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID album manquant", 400, "MISSING_ID");
  }

  const album = await prisma.photoAlbum.findUnique({ where: { id } });
  if (!album) {
    return fail("Album non trouvé", 404, "NOT_FOUND");
  }

  await prisma.photoAlbum.delete({ where: { id } });

  return ok({ message: "Album supprimé avec succès" });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
