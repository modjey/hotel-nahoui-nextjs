import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Durée de vie d'une réservation PENDING (non payée). Passé ce délai, la
 * réservation n'occupe plus la chambre : elle peut être annulée par le cron
 * et ne bloque plus la disponibilité, même si le cron n'a pas encore tourné.
 */
export const PENDING_BOOKING_TTL_MS = 15 * 60 * 1000;

/** Statuts qui rendent une chambre indisponible tant qu'ils couvrent la plage. */
export const BLOCKING_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

/**
 * Filtre Prisma des réservations qui bloquent réellement une chambre.
 * Un PENDING sans date d'expiration est considéré comme actif (compatibilité
 * avec les anciennes lignes) ; un PENDING expiré ne bloque plus.
 */
export function blockingBookingWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: "CONFIRMED" },
      {
        status: "PENDING",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    ],
  };
}

/**
 * Filtre des réservations qui chevauchent la plage [checkIn, checkOut)
 * pour une chambre donnée. `excludeBookingId` sert lors d'une édition admin.
 */
export function overlapBookingWhere(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  opts: { excludeBookingId?: string; now?: Date } = {},
): Prisma.BookingWhereInput {
  return {
    roomId,
    ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
    ...blockingBookingWhere(opts.now),
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
  };
}

/** true si la chambre est occupée sur la plage demandée. */
export async function hasBookingOverlap(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  opts: { excludeBookingId?: string; now?: Date } = {},
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: overlapBookingWhere(roomId, checkIn, checkOut, opts),
    select: { id: true },
  });
  return conflict !== null;
}

/** Référence lisible et non devinable : BK-XXXXXXXXXXXX. */
export function generateBookingReference(): string {
  return `BK-${randomBytes(6).toString("hex").toUpperCase()}`;
}

/** Référence de paiement lisible. */
export function generatePaymentReference(): string {
  return `PAY-${randomBytes(6).toString("hex").toUpperCase()}`;
}

/** Nombre de nuits (au moins 1) entre deux dates. */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

/**
 * Codes Prisma signalant un problème transitoire (contention, pool, réseau)
 * plutôt qu'une erreur de programmation.
 */
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // serveur injoignable
  "P1002", // timeout d'atteinte du serveur
  "P1008", // timeout d'opération
  "P1017", // connexion fermée par le serveur
  "P2024", // timeout du pool de connexions
  "P2028", // transaction expirée / fermée
  "P2034", // conflit d'écriture ou deadlock
]);

/** true si l'erreur est probablement transitoire (à retenter côté client). */
export function isTransientDatabaseError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientUnknownRequestError) return true;
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && TRANSIENT_PRISMA_CODES.has(code);
}

export class BookingConflictError extends Error {
  constructor(message = "Cette chambre n'est pas disponible pour ces dates") {
    super(message);
    this.name = "BookingConflictError";
  }
}

/**
 * Erreurs de transaction qu'il est sûr de rejouer : conflit de sérialisation
 * (P2034) et transaction expirée/fermée avant exécution (P2028). Les bases
 * serverless (Neon) peuvent dépasser le timeout par défaut au démarrage à froid.
 */
function isRetryableTransactionError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2034") return true;
  if (error.code === "P2028") {
    const message = String((error.meta as { error?: string } | undefined)?.error ?? error.message);
    return (
      message.includes("already closed") ||
      message.includes("expired") ||
      message.includes("Unable to start a transaction")
    );
  }
  return false;
}

/**
 * Exécute une opération en sérialisant les accès concurrents à une même chambre.
 *
 * On verrouille la ligne de la chambre (`SELECT ... FOR UPDATE`) au lieu de
 * compter sur l'isolation sérialisable : le verrou est déterministe, ne produit
 * pas d'aborts « serialization failure » en rafale, et garantit qu'une seule
 * transaction peut vérifier puis créer une réservation pour cette chambre.
 * Deux chambres différentes ne se bloquent pas mutuellement.
 */
export async function withRoomLock<T>(
  roomId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  { retries = 5 }: { retries?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Sérialise toutes les réservations de cette chambre jusqu'au commit.
          await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
          return fn(tx);
        },
        // Une file d'attente de verrous, ou un pool serverless lent, allonge
        // la transaction : on laisse de la marge avant d'abandonner.
        { maxWait: 20_000, timeout: 30_000 },
      );
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1) + Math.random() * 150));
    }
  }
  throw lastError;
}

/**
 * Bornes de validation d'une réservation.
 */
export const MAX_BOOKING_NIGHTS = 60;
export const MAX_GUESTS_PER_BOOKING = 20;

export interface DateValidationError {
  code: "INVALID_DATES" | "PAST_CHECKIN" | "TOO_LONG" | "GUESTS";
  message: string;
}

/**
 * Valide une plage de dates pour une nouvelle réservation client.
 * Les dates passées ne sont pas autorisées (tolérance d'une journée pour les
 * fuseaux horaires).
 */
export function validateBookingDates(
  checkIn: Date,
  checkOut: Date,
  opts: { allowPast?: boolean } = {},
): DateValidationError | null {
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { code: "INVALID_DATES", message: "Dates invalides" };
  }
  if (checkIn >= checkOut) {
    return { code: "INVALID_DATES", message: "La date de départ doit être après la date d'arrivée" };
  }
  if (!opts.allowPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      return { code: "PAST_CHECKIN", message: "La date d'arrivée ne peut pas être dans le passé" };
    }
  }
  if (nightsBetween(checkIn, checkOut) > MAX_BOOKING_NIGHTS) {
    return { code: "TOO_LONG", message: `Le séjour ne peut pas dépasser ${MAX_BOOKING_NIGHTS} nuits` };
  }
  return null;
}
