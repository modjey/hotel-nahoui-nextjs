import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { priceStayForRoom } from "@/lib/stay-pricing-server";
import { sendBookingReminderEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

const schema = z.object({ message: z.string().trim().max(3000).optional().nullable() });

/** POST /api/admin/admin-bookings/[id]/reminder — relance par email un client dont la demande est en attente. */
export const POST = withAuth(async (req) => {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? "";
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        room: { select: { name: true, basePrice: true, discountPercent: true, roomTypeId: true, minStay: true, currency: true } },
      },
    });
    if (!booking) return fail("Réservation introuvable", 404, "NOT_FOUND");
    if (booking.status !== "PENDING") return fail("Seule une demande en attente peut être relancée", 409, "NOT_PENDING");
    const to = booking.guestEmail || booking.user?.email;
    if (!to) return fail("Aucun email client sur cette réservation", 400, "NO_EMAIL");

    const stay = await priceStayForRoom(booking.room, booking.checkIn, booking.checkOut);
    const result = await sendBookingReminderEmail({
      to,
      name: [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || booking.user?.name || "Cher client",
      reference: booking.reference,
      roomName: booking.room.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      total: stay.total,
      currency: booking.room.currency,
      expiresAt: booking.expiresAt,
      message: parsed.data.message,
    });
    if (!result.success) return fail("L'email n'a pas pu être envoyé", 502, "EMAIL_FAILED");
    return ok({ sentTo: to });
  } catch (e) {
    console.error("[POST reminder]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}, { roles: ["ADMIN", "SUPER_ADMIN"] });
