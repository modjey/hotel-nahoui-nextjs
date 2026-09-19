import { prisma } from "@/lib/prisma";
import { sendAdminBookingNotification, type BookingNotificationData } from "@/lib/email";

export type AdminNotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "REVIEW_CREATED"
  | "CONTACT_MESSAGE"
  | "USER_REGISTERED";

export interface AdminNotificationInput {
  type: AdminNotificationType;
  title: string;
  message: string;
  /** Lien interne du panneau admin, ex: "/admin/bookings" */
  link?: string;
}

/**
 * Crée une notification interne visible dans le panneau admin.
 * Ne lève jamais d'exception : une notification ratée ne doit pas
 * faire échouer l'opération métier en cours.
 */
export async function createAdminNotification(input: AdminNotificationInput) {
  try {
    await prisma.adminNotification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      },
    });
  } catch (e) {
    console.error("[notifications] createAdminNotification failed:", e);
  }
}

function formatDateFr(value: Date | string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Notification complète pour une nouvelle réservation :
 * email admin (Resend) + notification interne dans le panneau admin.
 */
export async function notifyAdminNewBooking(booking: BookingNotificationData) {
  const guestName =
    [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") || "Client";
  const nights = Math.max(
    0,
    Math.round(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000
    )
  );

  await Promise.allSettled([
    sendAdminBookingNotification(booking),
    createAdminNotification({
      type: "BOOKING_CREATED",
      title: "Nouvelle réservation",
      message: `${booking.roomName || "Chambre"} — ${guestName}, ${nights} nuit${nights > 1 ? "s" : ""} (${formatDateFr(booking.checkIn)} → ${formatDateFr(booking.checkOut)})`,
      link: "/admin/bookings",
    }),
  ]);
}
