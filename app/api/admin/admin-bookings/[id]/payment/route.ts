import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function getBookingId(req: NextRequest) {
  const url = new URL(req.url);
  return url.pathname.split("/").slice(-2)[0];
}

function normalizePaymentData(body: any, existingReference?: string) {
  const amount = Number(body.amount);
  return {
    amount,
    currency: body.currency || "XOF",
    method: body.method || "CASH",
    provider: body.provider || "MANUAL",
    reference: body.reference || existingReference || `PAY-${Date.now()}`,
    status: body.status || "SUCCESS",
    paidAt: body.status === "SUCCESS" ? new Date() : null,
  };
}

async function syncBookingStatus(bookingId: string, paymentStatus?: string) {
  if (paymentStatus === "SUCCESS") {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
    return;
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "PENDING" } });
}

const handler = withAuth(async (req: NextRequest) => {
  const bookingId = getBookingId(req);

  if (req.method === "DELETE") {
    try {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
      if (!booking) return fail("Réservation introuvable", 404, "NOT_FOUND");
      if (!booking.payment) return fail("Aucun paiement à supprimer", 404, "NOT_FOUND");

      await prisma.payment.delete({ where: { id: booking.payment.id } });
      await syncBookingStatus(bookingId);

      return ok({ deleted: true });
    } catch (e) {
      console.error("[DELETE /api/admin/admin-bookings/[id]/payment]", e);
      return fail("Erreur serveur", 500, "INTERNAL");
    }
  }

  if (req.method !== "POST" && req.method !== "PATCH") {
    return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
  }

  try {
    const body = await req.json();
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) return fail("Réservation introuvable", 404, "NOT_FOUND");

    const data = normalizePaymentData(body, booking.payment?.reference);
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      return fail("amount doit être un montant valide", 400, "BAD_REQUEST");
    }

    const payment = booking.payment
      ? await prisma.payment.update({
          where: { id: booking.payment.id },
          data,
        })
      : await prisma.payment.create({
          data: {
            ...data,
            bookingId: booking.id,
            customerName: [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || null,
            customerEmail: booking.guestEmail,
            customerPhone: booking.guestPhone,
          },
        });

    await syncBookingStatus(bookingId, payment.status);

    return ok({ payment });
  } catch (e) {
    console.error(`[${req.method} /api/admin/admin-bookings/[id]/payment]`, e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as POST, handler as PATCH, handler as DELETE };
