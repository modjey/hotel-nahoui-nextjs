import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
});

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "GET") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ users });
  }

  if (req.method === "POST") {
    const parsed = await parseBody(req, userSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return fail("Un utilisateur avec cet email existe déjà", 400, "EMAIL_EXISTS");
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
    });

    return ok({ user });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST };
