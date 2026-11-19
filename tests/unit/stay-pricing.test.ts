import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupNights, minStayFor, nightlyPrice, priceStay, ruleForNight, type RateRule } from "@/lib/stay-pricing";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const room = { basePrice: 50_000, discountPercent: 0, roomTypeId: "suite", minStay: 1 };

const christmas: RateRule = { name: "Fêtes", roomTypeId: null, startDate: d("2026-12-20"), endDate: d("2027-01-03"), price: null, percent: 20, minStay: 3, createdAt: d("2026-10-01") };
const suitePromo: RateRule = { name: "Suites fêtes", roomTypeId: "suite", startDate: d("2026-12-24"), endDate: d("2026-12-26"), price: 70_000, percent: null, minStay: 2, createdAt: d("2026-09-01") };

describe("tarifs saisonniers", () => {
  it("garde le prix de base hors saison", () => {
    assert.equal(nightlyPrice(d("2026-11-10"), room, [christmas]).price, 50_000);
  });

  it("applique un ajustement en %", () => {
    assert.equal(nightlyPrice(d("2026-12-21"), room, [christmas]).price, 60_000);
  });

  it("exclut la date de fin de la période", () => {
    assert.equal(nightlyPrice(d("2027-01-03"), room, [christmas]).price, 50_000);
  });

  it("préfère une règle propre au type de chambre à une règle générale", () => {
    assert.equal(ruleForNight(d("2026-12-24"), room, [christmas, suitePromo])?.name, "Suites fêtes");
    assert.equal(nightlyPrice(d("2026-12-24"), room, [christmas, suitePromo]).price, 70_000);
  });

  it("ignore une règle d'un autre type de chambre", () => {
    assert.equal(nightlyPrice(d("2026-12-24"), { ...room, roomTypeId: "standard" }, [suitePromo]).price, 50_000);
  });

  it("applique la promo de la chambre après le tarif saisonnier", () => {
    assert.equal(nightlyPrice(d("2026-12-21"), { ...room, discountPercent: 10 }, [christmas]).price, 54_000);
  });

  it("n'applique pas la promo de la chambre sur un prix fixe saisonnier", () => {
    assert.equal(nightlyPrice(d("2026-12-25"), { ...room, discountPercent: 10 }, [suitePromo]).price, 70_000);
  });
});

describe("prix d'un séjour", () => {
  it("additionne les nuits à cheval sur deux périodes", () => {
    const stay = priceStay(room, d("2026-12-18"), d("2026-12-22"), [christmas]);
    assert.deepEqual(stay.nights.map((n) => n.price), [50_000, 50_000, 60_000, 60_000]);
    assert.equal(stay.total, 220_000);
  });

  it("calcule le séjour minimum selon la date d'arrivée", () => {
    assert.equal(minStayFor(d("2026-12-21"), room, [christmas]), 3);
    assert.equal(minStayFor(d("2026-11-21"), room, [christmas]), 1);
    assert.equal(minStayFor(d("2026-11-21"), { ...room, minStay: 2 }, [christmas]), 2);
  });

  it("regroupe les nuits consécutives au même prix", () => {
    const stay = priceStay(room, d("2026-12-18"), d("2026-12-22"), [christmas]);
    assert.deepEqual(
      groupNights(stay.nights).map((g) => [g.count, g.price]),
      [[2, 50_000], [2, 60_000]],
    );
  });
});

describe("fuseaux horaires", () => {
  it("retrouve le bon jour pour une date envoyée en « minuit heure de Paris »", () => {
    const parisMidnight = new Date("2026-12-20T23:00:00.000Z"); // 21 décembre à Paris
    assert.equal(nightlyPrice(parisMidnight, room, [christmas]).price, 60_000);
    const stay = priceStay(room, new Date("2026-12-18T23:00:00.000Z"), new Date("2026-12-20T23:00:00.000Z"), [christmas]);
    assert.deepEqual(stay.nights.map((n) => n.date), ["2026-12-19", "2026-12-20"]);
  });
});
