/**
 * Funcții pure pentru importul de produse (Excel/CSV) și adăugarea rapidă.
 * Acceptă atât modelul nou (nume, descriere, preț, categorie, gramaj, alergeni),
 * cât și formatul vechi (Produs, Descriere, Preț, Categorie).
 */

export const PRODUCT_TEMPLATE_HEADERS = [
  "nume",
  "descriere",
  "preț",
  "categorie",
  "gramaj",
  "alergeni",
] as const;

export type ParsedProductRow = {
  name: string;
  description: string;
  price: number;
  categoryName: string;
  weight: string;
  allergens: string;
};

const COLUMN_ALIASES: Record<keyof ParsedProductRow, string[]> = {
  name: ["nume", "produs", "product", "name", "denumire"],
  description: ["descriere", "description"],
  price: ["pret", "price"],
  categoryName: ["categorie", "category"],
  weight: ["gramaj", "weight", "cantitate"],
  allergens: ["alergeni", "allergens"],
};

/** „Preț” -> „pret”, „ Categorie ” -> „categorie”. */
export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase();
}

/** Acceptă „12,50”, „12.50”, „12,50 lei”, „1.250,00”. Returnează NaN dacă nu e număr. */
export function parsePrice(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  let text = String(value ?? "")
    .replace(/lei|ron/gi, "")
    .replace(/\s/g, "");
  if (!text) return NaN;
  if (text.includes(",") && text.includes(".")) {
    text =
      text.lastIndexOf(",") > text.lastIndexOf(".") ?
         text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  } else {
    text = text.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(text)) return NaN;
  return Math.round(Number(text) * 100) / 100;
}

export function parseProductRow(
  row: Record<string, unknown>,
): ParsedProductRow | null {
  const normalized = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    normalized.set(normalizeHeader(key), value);
  }
  const pick = (field: keyof ParsedProductRow) => {
    for (const alias of COLUMN_ALIASES[field]) {
      const value = normalized.get(alias);
      if (value !== undefined && String(value).trim() !== "") return value;
    }
    return "";
  };

  const name = String(pick("name")).trim();
  const categoryName = String(pick("categoryName")).trim();
  const price = parsePrice(pick("price"));
  if (!name || !categoryName || !Number.isFinite(price) || price < 0) {
    return null;
  }
  return {
    name,
    description: String(pick("description")).trim(),
    price,
    categoryName,
    weight: String(pick("weight")).trim(),
    allergens: String(pick("allergens")).trim(),
  };
}

/** Conținutul fișierului „Descarcă modelul” (cu BOM, ca Excel să afișeze diacriticele). */
export function buildProductTemplateCsv() {
  return `﻿${PRODUCT_TEMPLATE_HEADERS.join(",")}\r\n`;
}

export type QuickProductRow = {
  key: string;
  name: string;
  price: string;
  categoryId: string;
};

export type QuickRowError = { key: string; message: string };

/** Rândurile complet goale sunt ignorate; celelalte trebuie să fie complete. */
export function validateQuickRows(rows: QuickProductRow[]) {
  const valid: Array<{ key: string; name: string; price: number; categoryId: string }> = [];
  const errors: QuickRowError[] = [];
  for (const row of rows) {
    const name = row.name.trim();
    const priceText = row.price.trim();
    if (!name && !priceText) continue;
    const price = parsePrice(priceText);
    if (!name) {
      errors.push({ key: row.key, message: "Lipsește numele." });
    } else if (!Number.isFinite(price) || price <= 0) {
      errors.push({ key: row.key, message: "Prețul trebuie să fie mai mare decât 0." });
    } else if (!row.categoryId) {
      errors.push({ key: row.key, message: "Alege categoria." });
    } else {
      valid.push({ key: row.key, name, price, categoryId: row.categoryId });
    }
  }
  return { valid, errors };
}
