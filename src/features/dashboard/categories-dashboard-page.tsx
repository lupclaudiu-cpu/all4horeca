"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import type { Category } from "@/lib/types";
import {
  createCategory,
  deleteCategory,
  getDashboardCategories,
  updateCategory,
} from "@/services/commercial-service";
import { useRestaurant } from "@/features/restaurant/restaurant-context";

export function CategoriesDashboardPage() {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const accessLocked = Boolean(currentRestaurant?.accessLocked);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      setCategories(await getDashboardCategories(restaurantId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Încărcare eșuată.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (accessLocked) {
      setError(
        "Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.",
      );
      return;
    }
    if (!restaurantId) {
      setError(
        "Contul nu este legat de un restaurant. Verific asocierea proprietarului ?n zona Super administrator.",
      );
      return;
    }
    if (!name.trim()) {
      setError("Introdu un nume pentru categorie.");
      return;
    }
    setError(null);
    try {
      await createCategory(restaurantId, {
        name,
        active: true,
        sortOrder: categories.length + 1,
      });
      setName("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Creare eșuată.");
    }
  };

  const update = async (
    category: Category,
    changes: { name?: string; sortOrder?: number; active?: boolean },
  ) => {
    if (accessLocked) {
      setError(
        "Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.",
      );
      return;
    }
    setPendingId(category.id);
    setError(null);
    try {
      await updateCategory(category.id, changes);
      setCategories((current) =>
        current
          .map((item) =>
            item.id === category.id ? { ...item, ...changes } : item,
          )
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Actualizare eșuată.");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (category: Category) => {
    if (accessLocked) {
      setError(
        "Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.",
      );
      return;
    }
    if (!window.confirm(`Ștergi categoria „${category.name}”?`)) return;
    setPendingId(category.id);
    try {
      await deleteCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ștergere eșuată.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <DashboardHeader
        eyebrow="Catalog"
        title="Categorii"
        description="Controlează ordinea și vizibilitatea categoriilor din meniul public."
        action={
          <span className="rounded-full bg-blue-100 px-3 py-2 text-xs font-black text-blue-700">
            {categories.filter((item) => item.active !== false).length} active
          </span>
        }
      />

      {accessLocked && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.
        </p>
      )}

      <form
        onSubmit={add}
        className="mt-6 flex gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
      >
        <input
          disabled={accessLocked}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nume categorie"
          className="min-w-0 flex-1 rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm outline-none focus:border-[#2563eb]"
        />
        <button
          disabled={accessLocked}
          className="rounded-xl bg-[#2563eb] px-5 py-3 text-xs font-black text-white disabled:opacity-50"
        >
          Adaugă
        </button>
      </form>

      {!restaurantId && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Profilul autentificat nu are un restaurant asociat.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="h-72 animate-pulse bg-[#f8fafc]" />
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {categories.map((category) => (
              <div
                key={category.id}
                className="grid gap-3 p-4 sm:grid-cols-[70px_1fr_auto_auto] sm:items-center"
              >
                <label>
                  <span className="text-[10px] font-bold text-[#64748b]">Ordine</span>
                  <input
                    disabled={accessLocked}
                    type="number"
                    min="0"
                    value={category.sortOrder ?? 0}
                    onChange={(event) =>
                      setCategories((current) =>
                        current.map((item) =>
                          item.id === category.id ?
                             { ...item, sortOrder: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                    onBlur={() =>
                      void update(category, { sortOrder: category.sortOrder ?? 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-[#cbd5e1] px-2 py-2 text-sm"
                  />
                </label>
                <input
                  disabled={accessLocked}
                  value={category.name}
                  onChange={(event) =>
                    setCategories((current) =>
                      current.map((item) =>
                        item.id === category.id ?
                           { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  onBlur={() => void update(category, { name: category.name })}
                  className="rounded-xl border border-transparent px-3 py-3 text-sm font-black outline-none hover:border-[#cbd5e1] focus:border-[#2563eb]"
                />
                <button
                  type="button"
                  disabled={accessLocked || pendingId === category.id}
                  onClick={() =>
                    void update(category, { active: category.active === false })
                  }
                  className={`rounded-xl px-4 py-2 text-xs font-black ${
                    category.active === false ?
                       "bg-zinc-100 text-zinc-500"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {category.active === false ? "Inactivă" : "Activă"}
                </button>
                <button
                  type="button"
                  disabled={accessLocked || pendingId === category.id}
                  onClick={() => void remove(category)}
                  className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600 disabled:opacity-50"
                >
                  Șterge
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
