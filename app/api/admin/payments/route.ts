import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { z } from "zod";

const paymentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  status: z.enum(["SUCCESS", "PENDING", "FAILED"]),
  method: z.enum(["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER", "ON_SITE"]),
  reference: z.string(),
  transactionId: z.string().optional(),
});

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "POST") {
    const parsed = await parseBody(req, paymentSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Vérifier que la réservation existe
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
    });

    if (!booking) {
      return fail("Réservation introuvable", 400, "INVALID_BOOKING");
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: body.bookingId,
        amount: body.amount,
        currency: body.currency,
        status: body.status,
        method: body.method,
        reference: body.reference,
        transactionId: body.transactionId,
        provider: "ADMIN",
      },
    });

    return ok({ payment });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST };
