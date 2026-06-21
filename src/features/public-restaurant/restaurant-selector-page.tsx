"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AntoriaBrand } from "@/components/antoria-brand";
import { MapPinIcon } from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type RestaurantOption = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  address: string;
};

export function RestaurantSelectorPage() {
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [error, setError] = useState<string | null>(() =>
    isSupabaseConfigured() ?
       null
      : "Conexiunea cu platforma nu este configurată.",
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase
      .from("restaurants")
      .select("id, slug, name, logo_url, address")
      .eq("is_active", true)
      .eq("is_onboarding_template", false)
      .order("name")
      .then(({ data, error: restaurantError }) => {
        if (!active) return;
        if (restaurantError) {
          setError("Restaurantele nu au putut fi încărcate.");
        } else {
          setRestaurants((data ?? []) as RestaurantOption[]);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="antoria-gradient relative overflow-hidden px-5 pb-20 pt-8 sm:px-8">
        <div className="absolute -right-24 top-8 size-80 rounded-full border border-cyan-300/15" />
        <div className="absolute -left-20 bottom-0 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <AntoriaBrand inverse />
          <div className="max-w-3xl pb-10 pt-20 sm:pt-28">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              ALL4HORECA by ANTORIA
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-6xl">
              Selector intern de aplicatii restaurant.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Instrument pentru administrare, verificare si demonstratii.
              Clientii primesc direct linkul dedicat restaurantului.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-6xl px-5 pb-32 sm:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">
                Aplicatii configurate
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Deschide aplicatia restaurantului
              </h2>
            </div>
            <Link href="/cont" className="text-xs font-black text-blue-600">
              Cont client
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <p className="mt-6 rounded-2xl bg-red-50 px-5 py-6 text-sm font-bold text-red-700">
              {error} Reîncearcă după ce verifici conexiunea.
            </p>
          ) : restaurants.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/clienti/${restaurant.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 font-black text-blue-700">
                    {restaurant.logo_url ? (
                      <SafeImage
                        src={restaurant.logo_url}
                        alt=""
                        fallbackLabel={restaurant.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      restaurant.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-black group-hover:text-blue-700">
                      {restaurant.name}
                    </h3>
                    <p className="mt-2 flex items-center gap-1 truncate text-xs text-slate-500">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      {restaurant.address || "Adresă disponibilă în meniu"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl bg-slate-50 px-5 py-10 text-center text-sm font-bold text-slate-500">
              Nu există restaurante publice active momentan.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
