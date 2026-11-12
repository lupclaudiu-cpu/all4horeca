import assert from "node:assert/strict";
import test from "node:test";
import { toTelHref } from "../src/lib/phone.ts";

test("curăță numere românești", () => {
  assert.equal(toTelHref("0746 322 673"), "tel:0746322673");
  assert.equal(toTelHref("+40 746 322 673"), "tel:+40746322673");
  assert.equal(toTelHref("0040746322673"), "tel:+40746322673");
  assert.equal(toTelHref("(0254) 123-456"), "tel:0254123456");
});

test("respinge valori invalide", () => {
  assert.equal(toTelHref(""), null);
  assert.equal(toTelHref(null), null);
  assert.equal(toTelHref("abc"), null);
  assert.equal(toTelHref("12"), null);
});
