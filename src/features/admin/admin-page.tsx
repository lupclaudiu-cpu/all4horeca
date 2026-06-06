"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChartIcon, ProductsIcon } from "@/components/icons";
import type { AdminRestaurant } from "@/lib/types";
import {
  getAdminRestaurants,
  updateRestaurantActive,
} from "@/services/admin-service";
import { RestaurantWizard } from "@/features/admin/restaurant-wizard";

export function AdminPage() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRestaurants(await getAdminRestaurants());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Date indisponibile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRestaurants(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRestaurants]);

  const toggleRestaurant = async (item: AdminRestaurant) => {
    setSavingId(item.id);
    setError(null);
    try {
      await updateRestaurantActive(item.id, !item.isActive);
      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === item.id
            ? { ...restaurant, isActive: !restaurant.isActive }
            : restaurant,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Actualizare eșuată.");
    } finally {
      setSavingId(null);
    }
  };

  const totalOrders = restaurants.reduce(
    (sum, restaurant) => sum + restaurant.orderCount,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff5a1f]">
            Super Admin
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-[-0.06em]">
            Restaurante ALL4HORECA
          </h1>
          <p className="mt-2 text-sm text-[#7a746e]">
            Administrează restaurantele conectate la platformă.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-black text-white"
        >
          {showForm ? "Închide formularul" : "Adaugă restaurant"}
        </button>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <AdminMetric
          label="Restaurante"
          value={String(restaurants.length)}
          icon={<ProductsIcon className="size-5" />}
        />
        <AdminMetric
          label="Restaurante active"
          value={String(restaurants.filter((item) => item.isActive).length)}
          icon={<ProductsIcon className="size-5" />}
        />
        <AdminMetric
          label="Comenzi totale"
          value={String(totalOrders)}
          icon={<ChartIcon className="size-5" />}
        />
      </section>

      {showForm && (
        <RestaurantWizard
          onClose={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await loadRestaurants();
          }}
        />
      )}

      {error && (
        <p className="mt-5 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_12px_35px_rgba(24,18,12,0.04)]">
        <div className="border-b border-[#eee9e4] p-5">
          <h2 className="text-xl font-black">Lista restaurantelor</h2>
        </div>
        {loading ? (
          <div className="h-72 animate-pulse bg-[#f8f5f2]" />
        ) : restaurants.length ? (
          <div className="divide-y divide-[#eee9e4]">
            {restaurants.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-12 place-items-center rounded-xl text-xs font-black text-white"
                    style={{ backgroundColor: item.primaryColor }}
                  >
                    {item.name.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black">{item.name}</h3>
                    <p className="mt-1 text-xs text-[#8b8580]">/{item.slug}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#8b8580]">Comenzi</p>
                  <p className="mt-1 text-lg font-black">{item.orderCount}</p>
                </div>
                <Link
                  href={`/admin/restaurante/${item.id}`}
                  className="rounded-xl bg-[#171411] px-4 py-3 text-center text-xs font-black text-white"
                >
                  Deschide
                </Link>
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => void toggleRestaurant(item)}
                  className={`rounded-xl px-4 py-3 text-xs font-black ${
                    item.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {savingId === item.id
                    ? "Se salvează..."
                    : item.isActive
                      ? "Activ"
                      : "Inactiv"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="p-10 text-center text-sm font-bold text-[#8b8580]">
            Nu există restaurante.
          </p>
        )}
      </section>
    </div>
  );
}

function AdminMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#171411] p-5 text-white">
      <div className="flex items-center justify-between text-white/50">
        <p className="text-xs font-bold">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}
