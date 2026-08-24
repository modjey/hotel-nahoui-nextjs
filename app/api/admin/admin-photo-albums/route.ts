import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, parseBody } from "@/lib/auth/api";
import { slugify } from "@/lib/utils";

// Schema for creating an album
const createAlbumSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["GALLERY", "GUEST", "EVENT", "ROOM", "AMENITY"]).default("GALLERY"),
  coverImage: z.string().optional(),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  order: z.number().default(0),
  locationId: z.string().optional(),
});

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

// GET /api/admin/admin-photo-albums - List all albums (admin only)
export const GET = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const locationId = searchParams.get("locationId");
  const isPublished = searchParams.get("isPublished");

  const where: any = {};
  if (type) where.type = type;
  if (locationId) where.locationId = locationId;
  if (isPublished !== null && isPublished !== undefined && isPublished !== "") {
    where.isPublished = isPublished === "true";
  }

  const albums = await prisma.photoAlbum.findMany({
    where,
    include: {
      location: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      _count: {
        select: { photos: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return ok({ albums });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// POST /api/admin/admin-photo-albums - Create a new album (admin only)
export const POST = withAuth(async (req, { session }) => {
  const bodyResult = await parseBody(req, createAlbumSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { name, description, type, coverImage, isPublished, isFeatured, order, locationId } = bodyResult.data;

  const slug = slugify(name);
  
  // Check if slug already exists
  const existing = await prisma.photoAlbum.findUnique({ where: { slug } });
  if (existing) {
    return fail("Un album avec ce nom existe déjà", 409, "SLUG_EXISTS");
  }

  const album = await prisma.photoAlbum.create({
    data: {
      slug,
      name,
      description,
      type,
      coverImage,
      isPublished,
      isFeatured,
      order,
      locationId,
    },
  });

  return ok(album, { status: 201 });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
