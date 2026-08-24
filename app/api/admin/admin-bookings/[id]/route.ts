import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const id = req.url.split("/").pop();

  if (!id) {
    return fail("ID de réservation manquant", 400, "MISSING_ID");
  }

  if (req.method === "GET") {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        room: { select: { id: true, name: true, slug: true, coverImageUrl: true } },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            provider: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!booking) {
      return fail("Réservation introuvable", 404, "NOT_FOUND");
    }

    return ok({ booking });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET };
