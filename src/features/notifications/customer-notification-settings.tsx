"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrdersIcon } from "@/components/icons";
import { useAuth } from "@/features/auth/auth-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import {
  getPushPermission,
  isPushSubscribed,
  subscribeToRestaurantPush,
  unsubscribeFromRestaurantPush,
  type PushPermissionState,
} from "@/services/push-notification-service";

export function CustomerNotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant();
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    getPushPermission(),
  );
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentRestaurant || !user) return;
    let active = true;
    void isPushSubscribed(currentRestaurant.id).then((value) => {
      if (active) setSubscribed(value);
    });
    return () => {
      active = false;
    };
  }, [currentRestaurant, user]);

  const toggle = async () => {
    if (!currentRestaurant) return;
    setPending(true);
    setMessage(null);
    try {
      if (subscribed) {
        await unsubscribeFromRestaurantPush(currentRestaurant.id);
        setSubscribed(false);
        setMessage("Notificările au fost dezactivate.");
      } else {
        await subscribeToRestaurantPush(currentRestaurant.id);
        setSubscribed(true);
        setPermission("granted");
        setMessage("Notificările au fost activate.");
      }
    } catch (reason) {
      setPermission(getPushPermission());
      setMessage(
        reason instanceof Error ?
           reason.message
          : "Setarea nu a putut fi actualizată.",
      );
    } finally {
      setPending(false);
    }
  };

  if (authLoading || restaurantLoading) {
    return <main className="min-h-screen animate-pulse bg-slate-50" />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-28 pt-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">
          Preferințe
        </p>
        <h1 className="mt-1 text-3xl font-black">Notificări</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Primește actualizări despre comenzi și ofertele restaurantului.
        </p>

        {!user ? (
          <section className="mt-7 rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="font-black">Autentificarea este necesară</p>
            <p className="mt-2 text-sm text-slate-500">
              Abonamentele push sunt legate de contul clientului.
            </p>
            <Link
              href="/login?redirect=/cont/notificari"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              Autentificare
            </Link>
          </section>
        ) : !currentRestaurant ? (
          <section className="mt-7 rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="font-black">Selectează mai întâi un restaurant.</p>
          </section>
        ) : (
          <section className="mt-7 rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
                <OrdersIcon className="size-6" />
              </div>
              <div>
                <p className="font-black">{currentRestaurant.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Permisiune browser: {permissionLabel(permission)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void toggle()}
              disabled={pending || permission === "unsupported"}
              className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-black text-white disabled:opacity-50 ${
                subscribed ? "bg-slate-700" : "bg-blue-600"
              }`}
            >
              {pending ?
                 "Se actualizează..."
                : subscribed ?
                   "Dezactivează notificările"
                  : "Activează notificările"}
            </button>
            {permission === "denied" && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
                Permisiunea este blocată din browser. Activeaz-o din setările
                site-ului și încearcă din nou.
              </p>
            )}
            {message && (
              <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-800">
                {message}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function permissionLabel(permission: PushPermissionState) {
  if (permission === "granted") return "acordată";
  if (permission === "denied") return "blocată";
  if (permission === "unsupported") return "indisponibilă";
  return "neacordată";
}
