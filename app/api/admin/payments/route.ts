import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { generatePaymentReference } from "@/lib/bookings";
import { z } from "zod";

const paymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).max(8),
  status: z.enum(["SUCCESS", "PENDING", "FAILED"]),
  method: z.enum(["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER", "ON_SITE"]),
  reference: z.string().min(1).optional(),
  transactionId: z.string().optional(),
  dueAt: z.string().optional(),
});

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "POST") {
    const parsed = await parseBody(req, paymentSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
    });

    if (!booking) {
      return fail("Réservation introuvable", 400, "INVALID_BOOKING");
    }

    const reference = body.reference || generatePaymentReference();
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    const payment = await prisma.$transaction(async (tx) => {
      // Chaque appel crée une échéance distincte (acompte/versement).
      const saved = await tx.payment.create({
        data: {
          bookingId: body.bookingId,
          amount: body.amount,
          currency: body.currency,
          status: body.status,
          method: body.method,
          reference,
          transactionId: body.transactionId,
          provider: "ADMIN",
          dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
          paidAt: body.status === "SUCCESS" ? new Date() : null,
          customerName: [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || null,
          customerEmail: booking.guestEmail,
          customerPhone: booking.guestPhone,
        },
      });

      // Un paiement encaissé confirme la réservation et libère l'expiration.
      if (body.status === "SUCCESS" && booking.status !== "COMPLETED") {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED", expiresAt: null },
        });
      }

      return saved;
    });

    return ok({ payment }, { status: 201 });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST };
