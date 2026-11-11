import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSetupChecklist,
  settingsSavedByAdministrator,
  type SetupChecklistInput,
} from "../src/lib/setup-checklist.ts";
import {
  buildProductTemplateCsv,
  parsePrice,
  parseProductRow,
  validateQuickRows,
} from "../src/lib/product-import.ts";
import {
  getRestaurantScheduleStatus,
  isOrdersPaused,
  localDateKey,
  normalizeSpecialSchedule,
  restaurantSettings,
} from "../src/features/settings/restaurant-settings.ts";

const emptyRestaurant: SetupChecklistInput = {
  restaurant: {
    name: "Bistro Nou",
    logoUrl: null,
    phone: "",
    address: "",
    createdAt: "2026-11-10T10:00:00Z",
  },
  settings: {
    updatedAt: "2026-11-10T10:00:01Z",
    schedule: [{ enabled: true }],
    acceptsDelivery: true,
    acceptsPickup: true,
    acceptsCash: true,
    acceptsCard: true,
  },
  categoriesCount: 0,
  products: [],
  promotionsCount: 0,
  ordersCount: 0,
  publicLinkUsed: false,
};

test("restaurant nou: niciun pas obligatoriu bifat", () => {
  const result = buildSetupChecklist(emptyRestaurant);
  assert.equal(result.requiredTotal, 7);
  assert.equal(result.requiredDone, 0);
  assert.equal(result.allRequiredDone, false);
  assert.equal(result.steps.length, 8);
  assert.equal(result.steps.find((s) => s.id === "promotion")?.optional, true);
});

test("restaurant configurat complet: toți pașii obligatorii bifați, promoția opțională", () => {
  const result = buildSetupChecklist({
    ...emptyRestaurant,
    restaurant: {
      ...emptyRestaurant.restaurant,
      logoUrl: "https://x.supabase.co/storage/v1/object/public/restaurant-assets/a/logo.png",
      phone: "0740 000 000",
      address: "Str. Exemplu 1",
    },
    settings: { ...emptyRestaurant.settings, updatedAt: "2026-11-10T12:00:00Z" },
    categoriesCount: 2,
    products: [1, 2, 3, 4, 5].map((price) => ({ price, active: true })),
    ordersCount: 1,
    publicLinkUsed: true,
  });
  assert.equal(result.allRequiredDone, true);
  assert.equal(result.steps.find((s) => s.id === "promotion")?.done, false);
});

test("produsele fără preț sau inactive nu se numără", () => {
  const result = buildSetupChecklist({
    ...emptyRestaurant,
    products: [
      { price: 10 },
      { price: 12 },
      { price: 0 },
      { price: 15, active: false },
      { price: 20 },
      { price: 25 },
    ],
  });
  assert.equal(result.steps.find((s) => s.id === "products")?.done, false);
});

test("setările create la înregistrare nu contează ca salvate", () => {
  assert.equal(settingsSavedByAdministrator("2026-11-10T10:00:00Z", "2026-11-10T10:00:05Z"), false);
  assert.equal(settingsSavedByAdministrator("2026-11-10T10:00:00Z", "2026-11-10T11:00:00Z"), true);
  assert.equal(settingsSavedByAdministrator("2026-11-10T10:00:00Z", null), false);
});

test("parsePrice acceptă formate românești", () => {
  assert.equal(parsePrice("12,50"), 12.5);
  assert.equal(parsePrice("12.50 lei"), 12.5);
  assert.equal(parsePrice("1.250,00"), 1250);
  assert.equal(parsePrice(18), 18);
  assert.ok(Number.isNaN(parsePrice("gratuit")));
  assert.ok(Number.isNaN(parsePrice("")));
});

test("import: model nou și format vechi", () => {
  assert.deepEqual(
    parseProductRow({
      nume: "Pizza Margherita",
      descriere: "Sos, mozzarella",
      "preț": "32,5",
      categorie: "Pizza",
      gramaj: "450 g",
      alergeni: "gluten, lactoză",
    }),
    {
      name: "Pizza Margherita",
      description: "Sos, mozzarella",
      price: 32.5,
      categoryName: "Pizza",
      weight: "450 g",
      allergens: "gluten, lactoză",
    },
  );
  assert.equal(
    parseProductRow({ Produs: "Cola", Categorie: "Băuturi", "Preț": 8 })?.name,
    "Cola",
  );
  assert.equal(parseProductRow({ nume: "Fără preț", categorie: "X", pret: "" }), null);
  assert.equal(parseProductRow({ nume: "Fără categorie", pret: "5" }), null);
});

test("modelul CSV are antetul cerut", () => {
  assert.equal(
    buildProductTemplateCsv().replace("﻿", "").trim(),
    "nume,descriere,preț,categorie,gramaj,alergeni",
  );
});

test("adăugare rapidă: ignoră rândurile goale și raportează erorile", () => {
  const { valid, errors } = validateQuickRows([
    { key: "a", name: "Supă", price: "15", categoryId: "c1" },
    { key: "b", name: "", price: "", categoryId: "c1" },
    { key: "c", name: "Desert", price: "0", categoryId: "c1" },
    { key: "d", name: "Salată", price: "21,5", categoryId: "" },
  ]);
  assert.deepEqual(valid, [{ key: "a", name: "Supă", price: 15, categoryId: "c1" }]);
  assert.deepEqual(errors.map((e) => e.key), ["c", "d"]);
});

test("program special: zi închisă și program diferit", () => {
  const monday = new Date(2026, 11, 25, 12, 0); // 25 decembrie 2026, 12:00
  const settings = {
    ...restaurantSettings,
    specialSchedule: normalizeSpecialSchedule([
      { date: localDateKey(monday), closed: true, label: "Crăciun" },
      { date: "2026-12-31", closed: false, openingTime: "10:00", closingTime: "16:00", label: "" },
      { date: "invalid", closed: true },
    ]),
  };
  assert.equal(settings.specialSchedule.length, 2);
  const closed = getRestaurantScheduleStatus(settings, monday);
  assert.equal(closed.open, false);
  assert.match(closed.label, /Crăciun/);

  assert.equal(getRestaurantScheduleStatus(settings, new Date(2026, 11, 31, 15, 0)).open, true);
  assert.equal(getRestaurantScheduleStatus(settings, new Date(2026, 11, 31, 17, 0)).open, false);
  // O zi obișnuită folosește programul săptămânal (10:00-23:30).
  assert.equal(getRestaurantScheduleStatus(settings, new Date(2026, 11, 30, 17, 0)).open, true);
});

test("pauză comenzi: cu și fără termen", () => {
  const now = new Date("2026-11-11T12:00:00Z");
  assert.equal(isOrdersPaused({ ordersPaused: false, ordersPausedUntil: null }, now), false);
  assert.equal(isOrdersPaused({ ordersPaused: true, ordersPausedUntil: null }, now), true);
  assert.equal(
    isOrdersPaused({ ordersPaused: true, ordersPausedUntil: "2026-11-11T12:30:00Z" }, now),
    true,
  );
  assert.equal(
    isOrdersPaused({ ordersPaused: true, ordersPausedUntil: "2026-11-11T11:30:00Z" }, now),
    false,
  );
});
