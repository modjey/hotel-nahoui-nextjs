import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { PENDING_BOOKING_TTL_MS, generatePaymentReference } from "@/lib/bookings";
import { Prisma, PaymentStatus, PaymentMethod } from "@prisma/client";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function getBookingId(req: NextRequest) {
  const url = new URL(req.url);
  return url.pathname.split("/").slice(-2)[0];
}

const PAYMENT_STATUSES = new Set<string>(Object.values(PaymentStatus));
const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

function normalizePaymentData(body: Record<string, unknown>) {
  const amount = Number(body.amount);
  const rawStatus = typeof body.status === "string" ? body.status : "SUCCESS";
  const status: PaymentStatus = PAYMENT_STATUSES.has(rawStatus)
    ? (rawStatus as PaymentStatus)
    : "SUCCESS";
  const rawMethod = typeof body.method === "string" ? body.method : "CASH";
  const method: PaymentMethod = PAYMENT_METHODS.has(rawMethod)
    ? (rawMethod as PaymentMethod)
    : "CASH";
  const dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
  return {
    amount,
    currency: (body.currency as string) || "XOF",
    method,
    provider: (body.provider as string) || "MANUAL",
    status,
    dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
    paidAt: status === "SUCCESS" ? new Date() : null,
    transactionId: (body.transactionId as string) || null,
  };
}

/**
 * Un acompte encaissé (au moins un versement SUCCESS) confirme la réservation
 * et libère l'expiration du créneau.
 */
async function syncBookingStatus(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true },
  });
  if (!booking || booking.status === "CANCELLED" || booking.status === "COMPLETED") return;

  const paid = await prisma.payment.findFirst({
    where: { bookingId, status: "SUCCESS" },
    select: { id: true },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: paid
      ? { status: "CONFIRMED", expiresAt: null }
      : { status: "PENDING", expiresAt: new Date(Date.now() + PENDING_BOOKING_TTL_MS) },
  });
}

const handler = withAuth(async (req: NextRequest) => {
  const bookingId = getBookingId(req);

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return fail("Réservation introuvable", 404, "NOT_FOUND");

    if (req.method === "POST") {
      const body = await req.json();
      const data = normalizePaymentData(body);
      if (!Number.isFinite(data.amount) || data.amount <= 0) {
        return fail("amount doit être un montant valide", 400, "BAD_REQUEST");
      }

      const payment = await prisma.payment.create({
        data: {
          ...data,
          bookingId: booking.id,
          reference: (body.reference as string) || generatePaymentReference(),
          customerName: [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || null,
          customerEmail: booking.guestEmail,
          customerPhone: booking.guestPhone,
        },
      });

      await syncBookingStatus(bookingId);
      return ok({ payment }, { status: 201 });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const paymentId = body.paymentId as string | undefined;
      if (!paymentId) return fail("paymentId requis", 400, "BAD_REQUEST");

      const existing = await prisma.payment.findFirst({
        where: { id: paymentId, bookingId },
      });
      if (!existing) return fail("Paiement introuvable", 404, "NOT_FOUND");

      const data = normalizePaymentData({ ...existing, ...body });
      if (!Number.isFinite(data.amount) || data.amount <= 0) {
        return fail("amount doit être un montant valide", 400, "BAD_REQUEST");
      }

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          ...data,
          // Conserve la date d'encaissement d'un paiement déjà réussi.
          paidAt:
            data.status === "SUCCESS"
              ? existing.paidAt ?? new Date()
              : data.status === "PENDING"
                ? null
                : existing.paidAt,
        },
      });

      await syncBookingStatus(bookingId);
      return ok({ payment });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      let paymentId = url.searchParams.get("paymentId");
      if (!paymentId) {
        try {
          const body = await req.json();
          paymentId = body.paymentId;
        } catch {
          // pas de body
        }
      }
      if (!paymentId) return fail("paymentId requis", 400, "BAD_REQUEST");

      const existing = await prisma.payment.findFirst({
        where: { id: paymentId, bookingId },
      });
      if (!existing) return fail("Paiement introuvable", 404, "NOT_FOUND");

      await prisma.payment.delete({ where: { id: paymentId } });
      await syncBookingStatus(bookingId);

      return ok({ deleted: true });
    }

    return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Référence de paiement déjà utilisée", 409, "REFERENCE_TAKEN");
    }
    console.error(`[${req.method} /api/admin/admin-bookings/[id]/payment]`, e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST, handler as PATCH, handler as DELETE };
