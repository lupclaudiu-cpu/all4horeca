"use client";

import Link from "next/link";
import { useState } from "react";
import { TrashIcon } from "@/components/icons";
import type { Category } from "@/lib/types";
import {
  validateQuickRows,
  type QuickProductRow,
} from "@/lib/product-import";
import { saveQuickProducts } from "@/services/commercial-service";

const START_ROWS = 3;

function newRow(categoryId: string): QuickProductRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    price: "",
    categoryId,
  };
}

/** „Adăugare rapidă”: tabel editabil pe desktop, carduri pe telefon. */
export function QuickAddProducts({
  restaurantId,
  categories,
  startSortOrder,
  disabled,
  onSaved,
  onClose,
}: {
  restaurantId: string;
  categories: Category[];
  startSortOrder: number;
  disabled: boolean;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const defaultCategory = categories[0]?.id ?? "";
  const [rows, setRows] = useState<QuickProductRow[]>(() =>
    Array.from({ length: START_ROWS }, () => newRow(defaultCategory)),
  );
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateRow = (key: string, updates: Partial<QuickProductRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...updates } : row)),
    );
    setRowErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const addRow = () => {
    const lastCategory = rows[rows.length - 1]?.categoryId || defaultCategory;
    setRows((current) => [...current, newRow(lastCategory)]);
  };

  const removeRow = (key: string) =>
    setRows((current) =>
      current.length > 1 ? current.filter((row) => row.key !== key) : current,
    );

  const saveAll = async () => {
    if (disabled) return;
    const { valid, errors } = validateQuickRows(rows);
    setRowErrors(Object.fromEntries(errors.map((item) => [item.key, item.message])));
    if (errors.length) {
      setMessage({ type: "error", text: "Corectează rândurile marcate cu roșu." });
      return;
    }
    if (!valid.length) {
      setMessage({ type: "error", text: "Completează cel puțin un produs (nume și preț)." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { saved, failed } = await saveQuickProducts(restaurantId, valid, startSortOrder);
      await onSaved();
      const savedKeys = new Set(saved);
      setRows((current) => {
        const remaining = current.filter(
          (row) => !savedKeys.has(row.key) && (row.name.trim() || row.price.trim()),
        );
        return remaining.length ? remaining : [newRow(defaultCategory)];
      });
      setRowErrors(Object.fromEntries(failed.map((item) => [item.key, item.message])));
      setMessage(
        failed.length ?
           {
              type: "error",
              text: `${saved.length} produse salvate, ${failed.length} cu erori (rămase în listă).`,
            }
          : { type: "success", text: `${saved.length} produse au fost adăugate în meniu.` },
      );
    } finally {
      setSaving(false);
    }
  };

  if (!categories.length) {
    return (
      <section className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
        Adaugă mai întâi cel puțin o categorie (de exemplu „Pizza” sau
        „Băuturi”), apoi revino la adăugarea rapidă.{" "}
        <Link href="/restaurant/dashboard/categorii" className="underline">
          Mergi la Categorii
        </Link>
        <span className="mt-2 block font-semibold">
          Sau folosește importul Excel/CSV: categoriile din fișier se creează
          automat.
        </span>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-[1.5rem] border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Adăugare rapidă</h2>
          <p className="mt-1 text-sm text-slate-500">
            Scrie numele, prețul și categoria. Restul detaliilor (poză,
            descriere) le poți completa oricând din „Editează”.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-600"
        >
          Închide
        </button>
      </div>

      <div className="mt-4 hidden grid-cols-[1.6fr_.7fr_1fr_44px] gap-2 px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:grid">
        <span>Nume produs</span>
        <span>Preț (lei)</span>
        <span>Categorie</span>
        <span />
      </div>
      <div className="mt-3 space-y-3 md:mt-2 md:space-y-2">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={`grid gap-2 rounded-2xl border p-3 md:grid-cols-[1.6fr_.7fr_1fr_44px] md:items-start md:rounded-xl md:border-0 md:p-0 ${
              rowErrors[row.key] ? "border-red-200 bg-red-50/50 md:bg-transparent" : "border-slate-200"
            }`}
          >
            <label className="block">
              <span className="text-xs font-black text-slate-500 md:sr-only">
                Produs {index + 1}
              </span>
              <input
                value={row.name}
                onChange={(event) => updateRow(row.key, { name: event.target.value })}
                placeholder="ex. Pizza Margherita"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white md:mt-0"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500 md:sr-only">Preț (lei)</span>
              <input
                value={row.price}
                inputMode="decimal"
                onChange={(event) => updateRow(row.key, { price: event.target.value })}
                placeholder="0,00"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white md:mt-0"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500 md:sr-only">Categorie</span>
              <select
                value={row.categoryId}
                onChange={(event) => updateRow(row.key, { categoryId: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 md:mt-0"
              >
                <option value="">Alege categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              disabled={rows.length === 1}
              aria-label={`Șterge rândul ${index + 1}`}
              className="grid min-h-11 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <TrashIcon className="size-5" />
            </button>
            {rowErrors[row.key] && (
              <p className="text-xs font-bold text-red-700 md:col-span-4">{rowErrors[row.key]}</p>
            )}
          </div>
        ))}
      </div>

      {message && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={addRow}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
        >
          + Adaugă încă un rând
        </button>
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={saving || disabled}
          className="min-h-11 rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? "Se salvează..." : "Salvează tot"}
        </button>
      </div>
    </section>
  );
}
