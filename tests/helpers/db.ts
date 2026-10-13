import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma partagé par la suite de tests.
 * Se connecte à la base définie par DATABASE_URL (.env).
 */
export const prisma = new PrismaClient();

const trackedUserIds = new Set<string>();

/** Enregistre un utilisateur créé par les tests pour le supprimer ensuite. */
export function trackUser(id: string) {
  trackedUserIds.add(id);
}

/**
 * Filet de sécurité : supprime les réservations créées par les tests même
 * lorsqu'elles ne sont rattachées à aucun utilisateur (création admin), auquel
 * cas la suppression de l'utilisateur ne les nettoie pas en cascade.
 */
export async function deleteTestBookings() {
  await prisma.booking
    .deleteMany({ where: { guestEmail: { startsWith: "e2e-" } } })
    .catch(() => {});
  await prisma.booking
    .deleteMany({ where: { reference: { startsWith: "BK-E2E-" } } })
    .catch(() => {});
}

/**
 * Supprime tous les utilisateurs créés par les tests.
 * La suppression en cascade nettoie leurs réservations, paiements,
 * sessions et avis associés.
 */
export async function deleteTrackedUsers() {
  for (const id of trackedUserIds) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  trackedUserIds.clear();
}

/** Nettoyage complet des données de test. */
export async function cleanupTestData() {
  await deleteTrackedUsers();
  await deleteTestBookings();
}

export async function disconnect() {
  await prisma.$disconnect();
}

export function uniqueEmail(prefix: string) {
  return `e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Vérifie que la base est joignable (tolère un démarrage à froid serverless). */
export async function waitForDatabase({
  attempts = 10,
  delayMs = 1500,
}: { attempts?: number; delayMs?: number } = {}) {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(
    `Base de données injoignable (DATABASE_URL). Dernière erreur : ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
