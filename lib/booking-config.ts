/**
 * Paramètres des réservations, sans dépendance (utilisable côté serveur et dans les emails).
 *
 * Le paiement se fait hors plateforme : une demande PENDING bloque la chambre le temps que
 * l'équipe contacte le client et confirme. Passé ce délai, la demande n'occupe plus la
 * chambre et le cron l'annule. Configurable via PENDING_BOOKING_TTL_HOURS (24 h par défaut).
 */
const ttlHours = Number(process.env.PENDING_BOOKING_TTL_HOURS);
export const PENDING_BOOKING_TTL_HOURS = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24;
export const PENDING_BOOKING_TTL_MS = PENDING_BOOKING_TTL_HOURS * 60 * 60 * 1000;
