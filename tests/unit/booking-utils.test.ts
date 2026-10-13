import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_BOOKING_NIGHTS,
  PENDING_BOOKING_TTL_MS,
  blockingBookingWhere,
  generateBookingReference,
  nightsBetween,
  validateBookingDates,
} from "@/lib/bookings";
import { buildAvailabilityMap, isRangeAvailable } from "@/components/site/HotelBookingCalendar";
import { normalizePaymentStatus } from "@/lib/payments";

const DAY = 86_400_000;
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const atMidnight = (offsetDays: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
};

describe("nightsBetween", () => {
  it("compte les nuits d'un séjour", () => {
    assert.equal(nightsBetween(atMidnight(0), atMidnight(3)), 3);
  });

  it("renvoie au minimum 1 nuit", () => {
    assert.equal(nightsBetween(atMidnight(5), atMidnight(5)), 1);
    assert.equal(nightsBetween(atMidnight(5), atMidnight(2)), 1);
  });
});

describe("validateBookingDates", () => {
  it("rejette des dates invalides", () => {
    const res = validateBookingDates(new Date("n/a"), atMidnight(1));
    assert.equal(res?.code, "INVALID_DATES");
  });

  it("rejette un départ avant ou égal à l'arrivée", () => {
    assert.equal(validateBookingDates(atMidnight(2), atMidnight(2))?.code, "INVALID_DATES");
    assert.equal(validateBookingDates(atMidnight(3), atMidnight(1))?.code, "INVALID_DATES");
  });

  it("rejette une arrivée dans le passé", () => {
    assert.equal(validateBookingDates(atMidnight(-3), atMidnight(-1))?.code, "PAST_CHECKIN");
  });

  it("autorise le passé quand allowPast est vrai (usage admin)", () => {
    assert.equal(validateBookingDates(atMidnight(-3), atMidnight(-1), { allowPast: true }), null);
  });

  it("rejette un séjour trop long", () => {
    const res = validateBookingDates(atMidnight(0), atMidnight(MAX_BOOKING_NIGHTS + 2));
    assert.equal(res?.code, "TOO_LONG");
  });

  it("accepte une plage valide", () => {
    assert.equal(validateBookingDates(atMidnight(1), atMidnight(4)), null);
  });
});

describe("generateBookingReference", () => {
  it("respecte le format BK-XXXXXXXXXXXX", () => {
    assert.match(generateBookingReference(), /^BK-[0-9A-F]{12}$/);
  });

  it("ne produit pas de collision sur 1000 tirages", () => {
    const refs = new Set<string>();
    for (let i = 0; i < 1000; i++) refs.add(generateBookingReference());
    assert.equal(refs.size, 1000);
  });
});

describe("blockingBookingWhere", () => {
  it("bloque les CONFIRMED et les PENDING non expirés", () => {
    const now = new Date();
    const where = blockingBookingWhere(now) as any;
    assert.ok(Array.isArray(where.OR), "OR attendu");

    const confirmed = where.OR.find((c: any) => c.status === "CONFIRMED");
    assert.ok(confirmed, "CONFIRMED doit bloquer");

    const pending = where.OR.find((c: any) => c.status === "PENDING");
    assert.ok(pending, "PENDING doit bloquer temporairement");
    const pendingOr = pending.OR as any[];
    assert.ok(pendingOr.some((c) => c.expiresAt === null), "PENDING sans expiration bloquant");
    assert.ok(
      pendingOr.some((c) => c.expiresAt?.gt === now),
      "PENDING expirant dans le futur bloquant",
    );
  });

  it("ne bloque ni CANCELLED ni COMPLETED", () => {
    const where = blockingBookingWhere() as any;
    const statuses = where.OR.map((c: any) => c.status);
    assert.deepEqual([...new Set(statuses)].sort(), ["CONFIRMED", "PENDING"]);
  });
});

describe("buildAvailabilityMap / isRangeAvailable", () => {
  const in3 = atMidnight(+3);
  const in5 = atMidnight(+5);
  const iso = (d: Date) => d.toISOString();

  it("bloque chaque nuit réservée mais pas le jour de départ", () => {
    const map = buildAvailabilityMap([
      { checkIn: iso(in3), checkOut: iso(in5), status: "CONFIRMED" },
    ]);
    assert.equal(map[localKey(atMidnight(+3))]?.available, false);
    assert.equal(map[localKey(atMidnight(+4))]?.available, false);
    assert.equal(map[localKey(atMidnight(+5))], undefined, "le jour de départ reste libre");
  });

  it("ignore les réservations annulées ou terminées", () => {
    const map = buildAvailabilityMap([
      { checkIn: iso(in3), checkOut: iso(in5), status: "CANCELLED" },
      { checkIn: iso(in5), checkOut: iso(atMidnight(+7)), status: "COMPLETED" },
    ]);
    assert.equal(Object.keys(map).length, 0);
  });

  it("ignore un PENDING expiré mais bloque un PENDING actif", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + PENDING_BOOKING_TTL_MS).toISOString();

    const expired = buildAvailabilityMap([
      { checkIn: iso(in3), checkOut: iso(in5), status: "PENDING", expiresAt: past },
    ]);
    assert.equal(Object.keys(expired).length, 0, "PENDING expiré ne bloque pas");

    const active = buildAvailabilityMap([
      { checkIn: iso(in3), checkOut: iso(in5), status: "PENDING", expiresAt: future },
    ]);
    assert.equal(active[localKey(atMidnight(+3))]?.available, false, "PENDING actif bloque");
  });

  it("isRangeAvailable détecte une nuit occupée dans la plage", () => {
    const map = buildAvailabilityMap([
      { checkIn: iso(in3), checkOut: iso(in5), status: "CONFIRMED" },
    ]);
    assert.equal(isRangeAvailable(map, atMidnight(+2), atMidnight(+4)), false);
    assert.equal(isRangeAvailable(map, atMidnight(+5), atMidnight(+7)), true);
    assert.equal(isRangeAvailable(map, atMidnight(+2), atMidnight(+2)), true);
  });
});

describe("normalizePaymentStatus", () => {
  it("mappe les statuts fournisseurs vers PaymentStatus", () => {
    for (const s of ["SUCCESS", "success", "DONE", "PAID", "completed"]) {
      assert.equal(normalizePaymentStatus(s), "SUCCESS", `attendu SUCCESS pour ${s}`);
    }
    for (const s of ["FAILED", "failure", "CANCELLED", "error"]) {
      assert.equal(normalizePaymentStatus(s), "FAILED", `attendu FAILED pour ${s}`);
    }
    assert.equal(normalizePaymentStatus("REFUNDED"), "REFUNDED");
    assert.equal(normalizePaymentStatus("INITIALISE"), "PENDING");
    assert.equal(normalizePaymentStatus("PENDING"), "PENDING");
    assert.equal(normalizePaymentStatus(undefined), "PENDING");
  });
});
