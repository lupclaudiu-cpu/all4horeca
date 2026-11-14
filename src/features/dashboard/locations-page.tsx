"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/features/restaurant/restaurant-context";

type MyRestaurant = {
  id: string;
  name: string;
  slug: string;
  city: string;
  status: string;
  is_active: boolean;
  is_current: boolean;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500";

export function LocationsPage() {
  const { currentRestaurant } = useRestaurant();
  const [locations, setLocations] = useState<MyRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "",
    phone: "",
    address: "",
    city: "",
    companyName: currentRestaurant?.companyName ?? "",
    vatCui: currentRestaurant?.vatCui ?? "",
  });

  const load = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.rpc("my_restaurants");
    setLocations((data as MyRestaurant[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const switchTo = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("switch_active_restaurant", {
      target_restaurant_id: id,
    });
    if (error) {
      setMessage("Nu am putut schimba locația.");
      setBusy(false);
      return;
    }
    window.location.assign("/restaurant/dashboard");
  };

  const addLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch("/api/owner/add-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
      },
      body: JSON.stringify(form),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      restaurantId?: string;
    };
    if (!response.ok || !body.restaurantId) {
      setMessage(body.error ?? "Locația nu a putut fi adăugată.");
      setBusy(false);
      return;
    }
    await switchTo(body.restaurantId);
  };

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-black">Locațiile mele</h1>
        <p className="mt-1 text-sm text-slate-600">
          Toate locațiile sunt pe același cont. Fiecare locație are meniu,
          comenzi și 14 zile de testare proprii.
        </p>
      </header>

      <section className="space-y-3">
        {loading && <p className="text-sm text-slate-500">Se încarcă...</p>}
        {locations.map((location) => (
          <div
            key={location.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-bold">{location.name}</p>
              <p className="text-xs text-slate-500">
                {location.city || "—"} · {location.status === "trial" ? "în testare" : location.status}
              </p>
            </div>
            {location.is_current ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                Locație activă
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void switchTo(location.id)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Deschide
              </button>
            )}
          </div>
        ))}
      </section>

      <form onSubmit={addLocation} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Adaugă o locație nouă</h2>
        <input className={inputClass} placeholder="Nume locație (ex: Pizzeria Centru)" value={form.restaurantName} onChange={set("restaurantName")} required />
        <input className={inputClass} placeholder="Telefon locație" value={form.phone} onChange={set("phone")} required />
        <input className={inputClass} placeholder="Adresă" value={form.address} onChange={set("address")} required />
        <input className={inputClass} placeholder="Oraș" value={form.city} onChange={set("city")} required />
        <input className={inputClass} placeholder="Companie" value={form.companyName} onChange={set("companyName")} required />
        <input className={inputClass} placeholder="CUI" value={form.vatCui} onChange={set("vatCui")} required />
        {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? "Se creează..." : "Adaugă locația"}
        </button>
      </form>
    </div>
  );
}
