import assert from "node:assert/strict";
import test from "node:test";
import { usesStoriesUi } from "../src/lib/ui-variant.ts";
import {
  buildSelectedOptions,
  changeOptionQuantity,
  findMissingRequiredGroup,
  needsRequiredChoice,
  selectSingleOption,
} from "../src/lib/product-selection.ts";
import {
  getEstimatedReadyTime,
  getOrderProgressRatio,
  getOrderProgressSteps,
  isTrackableOrder,
} from "../src/lib/order-progress.ts";

test("interfața Stories e activă doar pentru restaurantul demo", () => {
  assert.equal(usesStoriesUi("burgerdemo"), true);
  assert.equal(usesStoriesUi("BurgerDemo"), true);
  assert.equal(usesStoriesUi("proba1"), false);
  assert.equal(usesStoriesUi(""), false);
  assert.equal(usesStoriesUi(null), false);
  assert.equal(usesStoriesUi(undefined), false);
});

const option = (id: string, name: string, priceDelta = 0, multiply = false) => ({
  id, name, priceDelta, multiplyByProductQuantity: multiply, active: true, sortOrder: 0,
});
const product = {
  optionGroups: [
    { id: "sos", name: "Sos", selectionType: "single" as const, required: true, active: true, sortOrder: 0,
      options: [option("casei", "Sos casei"), option("bbq", "BBQ", 2)] },
    { id: "extra", name: "Extra", selectionType: "multiple" as const, required: false, active: true, sortOrder: 1,
      options: [option("ched", "Cheddar", 4, true), option("bacon", "Bacon", 6)] },
  ],
};

test("grupul obligatoriu fără alegere e semnalat", () => {
  assert.equal(findMissingRequiredGroup(product, {})?.id, "sos");
  assert.equal(needsRequiredChoice(product), true);
  assert.equal(needsRequiredChoice({ optionGroups: [] }), false);
  const chosen = selectSingleOption({}, "sos", "bbq");
  assert.equal(findMissingRequiredGroup(product, chosen), undefined);
});

test("alegerea unică înlocuiește varianta anterioară", () => {
  let s = selectSingleOption({}, "sos", "casei");
  s = selectSingleOption(s, "sos", "bbq");
  assert.deepEqual(s, { sos: { bbq: 1 } });
});

test("cantitățile pentru extra cresc, scad și dispar la 0", () => {
  let s = changeOptionQuantity({}, "extra", "ched", 1);
  s = changeOptionQuantity(s, "extra", "ched", 1);
  assert.equal(s.extra.ched, 2);
  s = changeOptionQuantity(s, "extra", "ched", -5);
  assert.deepEqual(s.extra, {});
});

test("opțiunile alese au aceeași formă ca în coșul clasic", () => {
  const s = changeOptionQuantity(selectSingleOption({}, "sos", "bbq"), "extra", "ched", 1);
  assert.deepEqual(buildSelectedOptions(product, s), [
    { groupId: "sos", groupName: "Sos", optionId: "bbq", optionName: "BBQ", priceDelta: 2, quantity: 1, multiplyByProductQuantity: false },
    { groupId: "extra", groupName: "Extra", optionId: "ched", optionName: "Cheddar", priceDelta: 4, quantity: 1, multiplyByProductQuantity: true },
  ]);
  assert.deepEqual(buildSelectedOptions(null, s), []);
});

test("pașii comenzii urmează statusul din dashboard", () => {
  const steps = getOrderProgressSteps({ status: "În preparare", orderType: "delivery" });
  assert.deepEqual(steps.map((s) => s.state), ["done", "done", "current", "todo", "todo"]);
  assert.equal(steps[3].label, "Pe drum");
  const pickup = getOrderProgressSteps({ status: "În livrare", orderType: "pickup" });
  assert.equal(pickup[3].label, "Gata de ridicare");
  assert.equal(pickup[3].state, "current");
  const done = getOrderProgressSteps({ status: "Finalizată", orderType: "delivery" });
  assert.ok(done.every((s) => s.state === "done"));
  assert.ok(getOrderProgressSteps({ status: "Anulată", orderType: "delivery" }).every((s) => s.state === "todo"));
});

test("progres, comenzi urmăribile și ora estimată", () => {
  assert.equal(getOrderProgressRatio({ status: "Nouă" }), 0.2);
  assert.equal(getOrderProgressRatio({ status: "Anulată" }), 0);
  assert.equal(isTrackableOrder({ status: "În livrare" }), true);
  assert.equal(isTrackableOrder({ status: "Finalizată" }), false);
  assert.equal(isTrackableOrder({ status: "Anulată" }), false);
  assert.equal(getEstimatedReadyTime({ acceptedAt: "2026-11-21T17:00:00Z", estimatedMinutes: 35 }), "19:35");
  assert.equal(getEstimatedReadyTime({ acceptedAt: null, estimatedMinutes: 35 }), null);
  assert.equal(getEstimatedReadyTime({ acceptedAt: "2026-11-21T17:00:00Z", estimatedMinutes: null }), null);
});
