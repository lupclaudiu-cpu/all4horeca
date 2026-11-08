import assert from "node:assert/strict";
import { test } from "node:test";
import { buildInsights, previousRange } from "../src/features/dashboard/insights.ts";

const order = (over: Record<string, unknown>) =>
  ({
    id: "x", status: "Livrată", total: 50, orderType: "delivery", paymentMethod: "cash",
    createdAt: "2026-11-05T18:30:00", ...over,
  }) as never;

const range = { start: new Date("2026-11-01T00:00:00"), end: new Date("2026-11-08T00:00:00") };

test("previous range has the same length and ends where current starts", () => {
  const prev = previousRange(range);
  assert.equal(prev.end.getTime(), range.start.getTime());
  assert.equal(prev.end.getTime() - prev.start.getTime(), range.end.getTime() - range.start.getTime());
});

test("counts, peak hour, cancel rate and shares", () => {
  const data = buildInsights(
    [
      order({}), order({ createdAt: "2026-11-05T18:50:00", paymentMethod: "card", orderType: "pickup" }),
      order({ createdAt: "2026-11-06T12:00:00" }), order({ status: "Anulată" }),
    ],
    range,
  );
  assert.equal(data.current.count, 3);
  assert.equal(data.current.sales, 150);
  assert.equal(data.peakHour.hour, 18);
  assert.equal(data.cancelled, 1);
  assert.equal(data.cancelRate, 25);
  assert.equal(data.card.count, 1);
  assert.equal(data.pickup.percent, 33);
});

test("comparison with previous period", () => {
  const data = buildInsights([order({}), order({}), order({ createdAt: "2026-10-28T12:00:00" })], range);
  assert.equal(data.ordersChange, 100);
  assert.equal(data.salesChange, 100);
});

test("no previous orders gives null (new), none at all gives 0", () => {
  assert.equal(buildInsights([order({})], range).ordersChange, null);
  assert.equal(buildInsights([], range).ordersChange, 0);
});
