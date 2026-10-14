import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, parseBody, serializeUser } from "@/lib/auth/api";
import { createHash } from "crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Empty strings from forms: "" -> null (clears field), or undefined for password (no change)
const emptyToNull = (schema: z.ZodString) =>
  z.preprocess((v) => (v === "" ? null : v), schema.nullish());
const emptyToUndef = (schema: z.ZodString) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

// Schema for creating a user
const createUserSchema = z.object({
  email: emptyToNull(z.string().email()),
  phone: emptyToNull(z.string()),
  name: emptyToNull(z.string().min(1)),
  password: emptyToUndef(z.string().min(6)),
  role: z.enum(["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]).default("USER"),
  isActive: z.boolean().default(true),
  locationIds: z.array(z.string()).default([]),
}).refine((d) => d.email || d.phone, {
  message: "Email ou téléphone requis",
  path: ["email"],
});

// Schema for updating a user
const updateUserSchema = z.object({
  email: emptyToNull(z.string().email()),
  phone: emptyToNull(z.string()),
  name: emptyToNull(z.string().min(1)),
  password: emptyToUndef(z.string().min(6)),
  role: z.enum(["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  locationIds: z.array(z.string()).optional(),
});

// GET /api/admin/users - List all users (admin only)
export const GET = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role");
  const isActive = searchParams.get("isActive");

  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }
  if (role) {
    where.role = role;
  }
  if (isActive !== null && isActive !== undefined && isActive !== "") {
    where.isActive = isActive === "true";
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { sessions: true, accounts: true },
        },
        userLocations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return ok({
    users: users.map((u) => ({
      ...serializeUser(u),
      _count: u._count,
      userLocations: u.userLocations,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// POST /api/admin/users - Create a new user (admin only)
export const POST = withAuth(async (req, { session }) => {
  const bodyResult = await parseBody(req, createUserSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { email, phone, password, role, isActive, name, locationIds } = bodyResult.data;

  // Check if email or phone already exists
  const orConditions: any[] = [];
  if (email) orConditions.push({ email });
  if (phone) orConditions.push({ phone });

  const existing = orConditions.length > 0
    ? await prisma.user.findFirst({
        where: {
          OR: orConditions,
        },
      })
    : null;

  if (existing) {
    if (email && existing.email === email) {
      return fail("Un utilisateur avec cet email existe déjà", 409, "EMAIL_EXISTS");
    }
    if (phone && existing.phone === phone) {
      return fail("Un utilisateur avec ce téléphone existe déjà", 409, "PHONE_EXISTS");
    }
  }

  // Hash password if provided
  const passwordHash = password ? sha256(password) : null;

  const user = await prisma.user.create({
    data: {
      email: email || null,
      phone: phone || null,
      name: name || null,
      passwordHash,
      role,
      isActive,
      userLocations: (locationIds && locationIds.length > 0)
        ? {
            create: locationIds.map((locationId) => ({
              locationId,
            })),
          }
        : undefined,
    },
    include: {
      userLocations: {
        include: {
          location: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
    },
  });

  return ok(serializeUser(user), { status: 201 });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
