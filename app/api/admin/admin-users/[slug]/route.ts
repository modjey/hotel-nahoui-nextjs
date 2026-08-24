import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, parseBody, serializeUser } from "@/lib/auth/api";
import { createHash } from "crypto";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Schema for updating a user
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  locationIds: z.array(z.string()).default([]),
});

// GET /api/admin/users/[id] - Get a single user (admin only)
export const GET = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID utilisateur manquant", 400, "MISSING_ID");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: true,
      sessions: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
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
      bookings: {
        include: {
          room: {
            select: {
              id: true,
              name: true,
              slug: true,
              coverImageUrl: true,
            },
          },
          payment: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { checkIn: "desc" },
      },
    },
  });

  if (!user) {
    return fail("Utilisateur non trouvé", 404, "NOT_FOUND");
  }

  return ok({
    ...serializeUser(user),
    accounts: user.accounts,
    sessions: user.sessions,
    bookings: user.bookings,
  });
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// PUT /api/admin/users/[id] - Update a user (admin only)
export const PUT = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID utilisateur manquant", 400, "MISSING_ID");
  }

  const bodyResult = await parseBody(req, updateUserSchema);
  if (!bodyResult.ok) return bodyResult.response;

  const { email, phone, password, role, isActive, name, locationIds } = bodyResult.data;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return fail("Utilisateur non trouvé", 404, "NOT_FOUND");
  }

  // Prevent self-deactivation or role downgrade for super admins
  if (existing.id === session.userId) {
    if (isActive === false) {
      return fail("Vous ne pouvez pas désactiver votre propre compte", 400, "CANNOT_DEACTIVATE_SELF");
    }
    if (role && role !== existing.role && session.role !== "SUPER_ADMIN") {
      return fail("Vous ne pouvez pas modifier votre propre rôle", 400, "CANNOT_CHANGE_SELF_ROLE");
    }
  }

  // Check email/phone uniqueness if changed
  if (email && email !== existing.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return fail("Cet email est déjà utilisé", 409, "EMAIL_EXISTS");
    }
  }

  if (phone && phone !== existing.phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      return fail("Ce téléphone est déjà utilisé", 409, "PHONE_EXISTS");
    }
  }

  // Hash password if provided
  const passwordHash = password ? sha256(password) : undefined;

  // Handle location updates
  if (locationIds !== undefined) {
    // Delete existing user locations
    await prisma.userLocation.deleteMany({
      where: { userId: id },
    });
    
    // Create new user locations if provided
    if (locationIds.length > 0) {
      await prisma.userLocation.createMany({
        data: locationIds.map((locationId) => ({
          userId: id,
          locationId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(name !== undefined && { name }),
      ...(passwordHash !== undefined && { passwordHash }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
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

  return ok(serializeUser(user));
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

// DELETE /api/admin/users/[id] - Delete a user (super admin only)
export const DELETE = withAuth(async (req, { session }) => {
  const id = req.url.split("/").pop();
  
  if (!id) {
    return fail("ID utilisateur manquant", 400, "MISSING_ID");
  }

  // Prevent self-deletion
  if (id === session.userId) {
    return fail("Vous ne pouvez pas supprimer votre propre compte", 400, "CANNOT_DELETE_SELF");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return fail("Utilisateur non trouvé", 404, "NOT_FOUND");
  }

  // Only super admins can delete other admins
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    if (session.role !== "SUPER_ADMIN") {
      return fail("Seul un super admin peut supprimer un administrateur", 403, "FORBIDDEN");
    }
  }

  await prisma.user.delete({ where: { id } });

  return ok({ message: "Utilisateur supprimé avec succès" });
}, { roles: ["SUPER_ADMIN"] });
