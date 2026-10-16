import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

import { PENDING_BOOKING_TTL_MS, overlapBookingWhere } from "@/lib/bookings";
import { createActor, type TestActor } from "../helpers/auth";
import { cleanupTestData, disconnect, prisma, waitForDatabase } from "../helpers/db";
import { call, jsonPatch, jsonPost } from "../helpers/http";
import { startServer, stopServer } from "../helpers/server";

const DAY = 86_400_000;
/** Tolérance sur l'expiration (CI lente, latence réseau). */
const TTL_TOLERANCE_MS = 120_000;

interface PaymentShape {
  id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
}

interface BookingShape {
  id: string;
  reference: string;
  status: string;
  expiresAt: string | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  payments: PaymentShape[] | null;
  room?: { id: string; slug: string; name: string; basePrice: number; currency: string };
}

let baseUrl = "";
let room: { id: string; slug: string; basePrice: number; currency: string; maxGuests: number };
let client: TestActor;
let admin: TestActor;

/**
 * Plages de test déterministes et disjointes.
 *
 * Chaque appel réserve un créneau espacé de 14 jours dans un horizon lointain :
 * deux tests d'une même exécution ne peuvent donc jamais se chevaucher.
 * La base dérive de l'horloge (1 jour par seconde écoulée) pour qu'une
 * exécution ultérieure n'utilise pas les mêmes dates qu'une exécution précédente.
 */
const RUN_BASE_DAYS = 900 + (Math.floor(Date.now() / 1000) % 720);
let slotIndex = 0;

function futureRange(nights = 3) {
  const start = new Date(Date.now() + (RUN_BASE_DAYS + slotIndex * 14) * DAY);
  slotIndex += 1;
  start.setUTCHours(12, 0, 0, 0);
  return {
    start,
    checkIn: start.toISOString(),
    checkOut: new Date(start.getTime() + nights * DAY).toISOString(),
  };
}

function guestPayload(range: { checkIn: string; checkOut: string }, overrides: Record<string, unknown> = {}) {
  return {
    roomId: room.id,
    checkIn: range.checkIn,
    checkOut: range.checkOut,
    adults: 2,
    children: 0,
    guestFirstName: "E2E",
    guestLastName: "Test",
    guestEmail: "e2e-guest@example.com",
    ...overrides,
  };
}

async function createBooking(actor: TestActor, range: { checkIn: string; checkOut: string }, overrides = {}) {
  return jsonPost(baseUrl, "/api/bookings", guestPayload(range, overrides), actor.headers);
}

async function availability(range: { checkIn: string; checkOut: string }, userId?: string) {
  const qs = `checkIn=${encodeURIComponent(range.checkIn)}&checkOut=${encodeURIComponent(range.checkOut)}${userId ? `&userId=${userId}` : ""}`;
  return call(baseUrl, `/api/rooms/${room.slug}/availability?${qs}`);
}

/** Charge utile de webhook adaptée au fournisseur configuré. */
function paymentCallback(reference: string, outcome: "success" | "failed") {
  const provider = (process.env.PAYMENT_PROVIDER || "fineopay").toLowerCase();
  if (provider === "centralapis") {
    return {
      partner_reference: reference,
      state: outcome === "success" ? "DONE" : "FAILURE",
      transaction_reference: `TX-${reference}`,
    };
  }
  return {
    syncRef: `SYNC-${Math.random().toString(36).slice(2, 10)}`,
    reference,
    status: outcome,
    amount: 1,
  };
}

before(async () => {
  await waitForDatabase();
  baseUrl = await startServer();

  const roomsRes = await call(baseUrl, "/api/rooms");
  const rooms: any[] = roomsRes.body?.data?.rooms ?? [];
  assert.ok(
    rooms.length > 0,
    "Aucune chambre publiée en base : impossible de tester les réservations.",
  );
  const first = rooms[0];
  room = {
    id: first.id,
    slug: first.slug,
    basePrice: first.basePrice,
    currency: first.currency,
    maxGuests: first.maxGuests,
  };

  client = await createActor("USER");
  admin = await createActor("ADMIN");
});

after(async () => {
  stopServer();
  await cleanupTestData();
  await disconnect();
});

describe("Cycle de vie d'une réservation", () => {
  const range = futureRange(3);
  let booking: BookingShape;

  it("crée une réservation PENDING avec paiement et expiration", async () => {
    const res = await createBooking(client, range);
    assert.equal(res.status, 201, `création attendue 201, reçu ${res.status} ${JSON.stringify(res.body)}`);

    booking = res.body.data.booking as BookingShape;
    assert.equal(booking.status, "PENDING");
    assert.ok(booking.expiresAt, "expiresAt doit être défini pour un PENDING");
    assert.match(booking.reference, /^BK-[0-9A-F]{12}$/);

    const drift = Math.abs(new Date(booking.expiresAt!).getTime() - (Date.now() + PENDING_BOOKING_TTL_MS));
    assert.ok(drift <= TTL_TOLERANCE_MS, `expiration à ${drift}ms du TTL attendu`);

    assert.ok(booking.payments?.length, "un paiement PENDING doit être créé avec la réservation");
    assert.equal(booking.payments![0].status, "PENDING");
    assert.equal(
      booking.payments![0].amount,
      room.basePrice * 3,
      "le montant doit valoir prix de base × nuits",
    );
  });

  it("expose la réservation et son paiement au client", async () => {
    const res = await call(baseUrl, "/api/bookings", { headers: client.headers });
    assert.equal(res.status, 200);
    const mine = (res.body.data.bookings as BookingShape[]).find((b) => b.id === booking.id);
    assert.ok(mine, "la réservation doit apparaître dans la liste du client");
    assert.ok(mine!.payments?.length, "le paiement doit être inclus (bouton « Payer maintenant »)");
  });

  it("refuse une seconde réservation sur la même plage", async () => {
    const res = await createBooking(client, range, { guestEmail: "e2e-dup@example.com" });
    assert.equal(res.status, 409, `conflit attendu 409, reçu ${res.status}`);
  });

  it("refuse un chevauchement partiel", async () => {
    const shifted = {
      checkIn: new Date(range.start.getTime() + DAY).toISOString(),
      checkOut: new Date(range.start.getTime() + 4 * DAY).toISOString(),
    };
    const res = await createBooking(client, shifted, { guestEmail: "e2e-partial@example.com" });
    assert.equal(res.status, 409, `conflit attendu 409, reçu ${res.status}`);
  });

  it("marque la chambre indisponible et signale la réservation du client", async () => {
    const res = await availability(range, client.id);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.available, false);
    assert.equal(res.body.data.isOwnBooking, true);
    assert.ok(res.body.data.conflictingBookings.length >= 1);
  });

  it("libère la chambre dès que le PENDING expire", async () => {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const res = await availability(range);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.available, true, "un PENDING expiré ne doit plus bloquer");
  });

  it("permet de réserver à nouveau après expiration", async () => {
    const res = await createBooking(client, range, { guestEmail: "e2e-rebook@example.com" });
    assert.equal(res.status, 201, `re-réservation attendue 201, reçu ${res.status}`);
    booking = res.body.data.booking as BookingShape;
  });

  it("annule les PENDING expirés via le cron et solde le paiement", async () => {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const secret = process.env.CRON_SECRET;
    const res = await call(baseUrl, "/api/cron/cleanup-expired-bookings", {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const after = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(after?.status, "CANCELLED");
    assert.equal(after?.expiresAt, null, "expiresAt doit être libéré");

    const payment = await prisma.payment.findFirst({ where: { bookingId: booking.id } });
    assert.equal(payment?.status, "FAILED");
  });

  it("protège le cron quand un secret est configuré", async () => {
    const secret = process.env.CRON_SECRET;
    const res = await call(baseUrl, "/api/cron/cleanup-expired-bookings");
    if (secret) {
      assert.equal(res.status, 401, "sans Bearer, le cron doit refuser");
    } else {
      // Sans CRON_SECRET configuré, la route est ouverte : comportement actuel assumé.
      assert.equal(res.status, 200);
    }
  });

  it("interdit les routes admin à un utilisateur simple", async () => {
    for (const path of [
      "/api/admin/bookings",
      "/api/admin/admin-dishes",
      "/api/admin/admin-dish-categories",
      "/api/admin/stats",
    ]) {
      const res = await call(baseUrl, path, { headers: client.headers });
      assert.equal(res.status, 403, `${path} doit renvoyer 403, reçu ${res.status}`);
    }

    // /api/admin/upload n'expose que POST : on teste la méthode réelle.
    const upload = await call(baseUrl, "/api/admin/upload", {
      method: "POST",
      headers: client.headers,
      body: new FormData(),
    });
    assert.equal(upload.status, 403, `upload doit renvoyer 403, reçu ${upload.status}`);
  });

  it("autorise un admin à lister et créer une réservation", async () => {
    const list = await call(baseUrl, "/api/admin/bookings", { headers: admin.headers });
    assert.equal(list.status, 200, `liste admin reçue ${list.status}`);

    const adminRange = futureRange(2);
    const res = await jsonPost(
      baseUrl,
      "/api/admin/bookings",
      // userId renseigné pour que le nettoyage en cascade supprime la réservation.
      guestPayload(adminRange, { status: "PENDING", guestEmail: "e2e-admin@example.com", userId: admin.id }),
      admin.headers,
    );
    assert.equal(res.status, 200, `création admin reçue ${res.status} ${JSON.stringify(res.body)}`);

    const created = res.body.data.booking as BookingShape;
    assert.match(created.reference, /^BK-[0-9A-F]{12}$/);
    assert.ok(created.expiresAt, "une réservation admin PENDING doit aussi expirer");
  });

  it("refuse la confirmation admin d'une réservation en conflit", async () => {
    const conflictRange = futureRange(2);
    const seed = await createBooking(client, conflictRange, { guestEmail: "e2e-conflict@example.com" });
    assert.equal(seed.status, 201);

    const overlap = await prisma.booking.create({
      data: {
        roomId: room.id,
        checkIn: new Date(conflictRange.start.getTime() + DAY),
        checkOut: new Date(conflictRange.start.getTime() + 3 * DAY),
        adults: 1,
        children: 0,
        status: "PENDING",
        reference: `BK-E2E-CONFLICT-${Date.now()}`,
        expiresAt: new Date(Date.now() + PENDING_BOOKING_TTL_MS),
        payments: {
          create: { reference: `PAY-E2E-CONFLICT-${Date.now()}`, amount: 1000, currency: "XOF", status: "SUCCESS" },
        },
      },
    });

    try {
      const res = await jsonPatch(
        baseUrl,
        `/api/admin/admin-bookings?id=${overlap.id}`,
        { status: "CONFIRMED" },
        admin.headers,
      );
      assert.equal(res.status, 409, `conflit attendu 409, reçu ${res.status}`);

      const stillPending = await prisma.booking.findUnique({ where: { id: overlap.id } });
      assert.equal(stillPending?.status, "PENDING");
    } finally {
      await prisma.booking.delete({ where: { id: overlap.id } }).catch(() => {});
    }
  });

  it("n'attribue qu'une seule réservation en cas de concurrence", async () => {
    const raceRange = futureRange(2);

    // Diagnostic : une plage déjà occupée fausserait complètement le test.
    const blockers = await prisma.booking.findMany({
      where: overlapBookingWhere(room.id, new Date(raceRange.checkIn), new Date(raceRange.checkOut)),
      select: { reference: true, status: true, checkIn: true, checkOut: true, guestEmail: true, createdAt: true },
    });
    assert.equal(
      blockers.length,
      0,
      `Données résiduelles : ${blockers.length} réservation(s) active(s) chevauchent la plage de test ` +
        `${raceRange.checkIn} → ${raceRange.checkOut} : ${JSON.stringify(blockers)}. ` +
        `Nettoyez la base de test.`,
    );

    const racers = await Promise.all(Array.from({ length: 6 }, () => createActor("USER")));

    const responses = await Promise.all(racers.map((r) => createBooking(r, raceRange)));
    const created = responses.filter((r) => r.status === 201).length;
    const conflicts = responses.filter((r) => r.status === 409).length;
    const detail = `statuts=${JSON.stringify(responses.map((r) => r.status))} corps=${JSON.stringify(
      responses.filter((r) => r.status !== 201 && r.status !== 409).map((r) => r.body),
    ).slice(0, 400)}`;

    assert.equal(created, 1, `1 seule réservation attendue, ${created} créées. ${detail}`);
    assert.equal(conflicts, 5, `5 conflits attendus, ${conflicts} reçus. ${detail}`);

    const active = await prisma.booking.count({
      where: {
        roomId: room.id,
        checkIn: new Date(raceRange.checkIn),
        checkOut: new Date(raceRange.checkOut),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    assert.equal(active, 1, "une seule réservation active doit exister en base");
  });
});

describe("Idempotence et cohérence des paiements", () => {
  const range = futureRange(3);
  let booking: BookingShape;

  it("confirme la réservation quand le paiement réussit", async () => {
    const res = await createBooking(client, range, { guestEmail: "e2e-pay@example.com" });
    assert.equal(res.status, 201);
    booking = res.body.data.booking as BookingShape;
    assert.ok(booking.payments?.length, "paiement attendu");

    const cb = await jsonPost(baseUrl, "/api/payments/callback", paymentCallback(booking.payments![0].reference, "success"));
    assert.equal(cb.status, 200, `callback reçu ${cb.status} ${JSON.stringify(cb.body)}`);

    const payment = await prisma.payment.findUnique({ where: { id: booking.payments![0].id } });
    assert.equal(payment?.status, "SUCCESS");
    assert.ok(payment?.paidAt, "paidAt doit être renseigné");

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(updated?.status, "CONFIRMED");
    assert.equal(updated?.expiresAt, null, "expiresAt doit être libéré à la confirmation");
  });

  it("ne rétrograde ni ne dé-confirme sur un événement FAILED tardif", async () => {
    const cb = await jsonPost(baseUrl, "/api/payments/callback", paymentCallback(booking.payments![0].reference, "failed"));
    assert.equal(cb.status, 200);

    const payment = await prisma.payment.findUnique({ where: { id: booking.payments![0].id } });
    assert.equal(payment?.status, "SUCCESS", "un paiement réussi ne doit jamais être rétrogradé");

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(updated?.status, "CONFIRMED", "une réservation confirmée ne doit pas être annulée");
  });

  it("reste neutre quand le même événement est rejoué", async () => {
    const before = await prisma.payment.findUnique({ where: { id: booking.payments![0].id } });
    const cb = await jsonPost(baseUrl, "/api/payments/callback", paymentCallback(booking.payments![0].reference, "success"));
    assert.equal(cb.status, 200);
    assert.equal(cb.body.success, true);

    const after = await prisma.payment.findUnique({ where: { id: booking.payments![0].id } });
    assert.equal(after?.status, "SUCCESS");
    assert.equal(after?.paidAt?.getTime(), before?.paidAt?.getTime(), "un rejeu ne doit pas modifier paidAt");

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(updated?.status, "CONFIRMED");
  });

  it("ne reconfirme pas une réservation annulée (paiement tardif)", async () => {
    const lateRange = futureRange(2);
    const res = await createBooking(client, lateRange, { guestEmail: "e2e-late@example.com" });
    assert.equal(res.status, 201);
    const late = res.body.data.booking as BookingShape;

    // Simule une annulation (expiration) avant l'arrivée du paiement.
    await prisma.booking.update({ where: { id: late.id }, data: { status: "CANCELLED", expiresAt: null } });

    const cb = await jsonPost(baseUrl, "/api/payments/callback", paymentCallback(late.payments![0].reference, "success"));
    assert.equal(cb.status, 200);

    const after = await prisma.booking.findUnique({ where: { id: late.id } });
    assert.equal(after?.status, "CANCELLED", "un paiement tardif ne doit pas reconfirmer automatiquement");

    const notification = await prisma.adminNotification.findFirst({
      where: { title: "Paiement reçu après annulation" },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(notification, "un paiement tardif doit être signalé à l'admin");
  });

  it("expose le statut de paiement via /api/payments/status", async () => {
    const res = await call(baseUrl, `/api/payments/status?reference=${booking.payments![0].reference}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, "SUCCESS");
  });

  it("renvoie 404 sur une référence de paiement inconnue", async () => {
    const res = await call(baseUrl, "/api/payments/status?reference=PAY-INEXISTANT-E2E");
    assert.equal(res.status, 404);
  });
});
