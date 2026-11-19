import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { createAdminNotification, notifyGuestBookingStatus } from "@/lib/notifications";

export const runtime = "nodejs";

const actionSchema = z.object({ action: z.literal("cancel") });

/**
 * PATCH /api/bookings/[id]  { "action": "cancel" }
 * Le client annule lui-même une demande encore en attente (PENDING, aucun paiement encaissé).
 * Une réservation confirmée ou déjà réglée s'annule auprès de l'hôtel (règlement hors plateforme).
 */
export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const id = req.nextUrl.pathname.split("/").pop()!;
  const parsed = await parseBody(req, actionSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { select: { name: true } }, payments: { select: { status: true } } },
    });
    if (!booking || booking.userId !== ctx.session.userId) {
      return fail("Réservation introuvable", 404, "NOT_FOUND");
    }
    if (booking.status !== "PENDING") {
      return fail(
        "Seule une demande en attente peut être annulée en ligne. Contactez l'hôtel pour modifier une réservation confirmée.",
        409,
        "NOT_CANCELLABLE",
      );
    }
    if (booking.payments.some((p) => p.status === "SUCCESS")) {
      return fail(
        "Un règlement a déjà été enregistré pour cette réservation. Contactez l'hôtel pour l'annuler.",
        409,
        "ALREADY_PAID",
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.booking.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "CANCELLED", expiresAt: null },
      });
      if (res.count === 0) return null;
      await tx.payment.updateMany({
        where: { bookingId: id, status: "PENDING" },
        data: { status: "FAILED" },
      });
      return tx.booking.findUnique({ where: { id } });
    });
    if (!updated) {
      return fail("Cette demande a déjà changé de statut. Rechargez la page.", 409, "CONFLICT");
    }

    await Promise.allSettled([
      createAdminNotification({
        type: "BOOKING_CANCELLED",
        title: "Demande annulée par le client",
        message: [
          [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || "Un client",
          "a annulé sa demande",
          booking.reference,
          `(${booking.room?.name ?? "chambre"}).`,
        ]
          .filter(Boolean)
          .join(" "),
        link: `/admin/bookings/${booking.id}`,
      }),
      notifyGuestBookingStatus({
        status: "CANCELLED",
        reference: booking.reference,
        roomName: booking.room?.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestFirstName: booking.guestFirstName,
        guestLastName: booking.guestLastName,
        guestEmail: booking.guestEmail,
      }),
    ]);

    return ok({ booking: updated });
  } catch (e) {
    console.error("[PATCH /api/bookings/[id]]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
});
