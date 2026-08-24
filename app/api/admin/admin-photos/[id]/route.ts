import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, parseBody } from "@/lib/auth/api";
import { slugify } from "@/lib/utils";

// Schema for updating a photo
const updatePhotoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().optional(),
});

// GET /api/admin/admin-photos/[id] - Get a single photo (admin only)
export const GET = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID photo manquant", 400, "MISSING_ID");
  }

  const photo = await prisma.photo.findUnique({
    where: { id },
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
  });

  if (!photo) {
    return fail("Photo non trouvée", 404, "NOT_FOUND");
  }

  return ok(photo);
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// PUT /api/admin/admin-photos/[id] - Update a photo (admin only)
export const PUT = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID photo manquant", 400, "MISSING_ID");
  }

  const bodyResult = await parseBody(req, updatePhotoSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { title, description, isApproved, isFeatured, order } = bodyResult.data;

  // Check if photo exists
  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) {
    return fail("Photo non trouvée", 404, "NOT_FOUND");
  }

  // Update slug if title changed
  let slug = undefined;
  if (title && title !== existing.title) {
    slug = slugify(title);
  }

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(isApproved !== undefined && { isApproved }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(order !== undefined && { order }),
    },
  });

  return ok(photo);
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// DELETE /api/admin/admin-photos/[id] - Delete a photo (admin only)
export const DELETE = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID photo manquant", 400, "MISSING_ID");
  }

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return fail("Photo non trouvée", 404, "NOT_FOUND");
  }

  await prisma.photo.delete({ where: { id } });

  return ok({ message: "Photo supprimée avec succès" });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
