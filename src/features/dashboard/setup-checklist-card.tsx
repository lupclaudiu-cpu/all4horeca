"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCatalog } from "@/features/catalog/catalog-context";
import { PublicMenuPreviewButton } from "@/features/dashboard/public-menu-preview-button";
import { useOrders } from "@/features/orders/order-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { buildSetupChecklist, readPublicLinkUsed } from "@/lib/setup-checklist";
import { trialDaysLeft } from "@/lib/trial";
import { getPromotions } from "@/services/commercial-service";

/** Cardul „Configurează-ți restaurantul” de pe pagina Prezentare. */
export function SetupChecklistCard() {
  const { currentRestaurant } = useRestaurant();
  const { profile } = useAuth();
  const { settings, hydrated: settingsReady, settingsUpdatedAt } =
    useRestaurantSettings();
  const { products, categories, loading: catalogLoading } = useCatalog();
  const { orders, hydrated: ordersReady } = useOrders();
  const restaurantId = currentRestaurant?.id;
  const [promotionsCount, setPromotionsCount] = useState(0);
  const [publicLinkUsed, setPublicLinkUsed] = useState(false);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setPublicLinkUsed(readPublicLinkUsed(restaurantId));
    }, 0);
    // Revine din tab-ul cu meniul public: recitim bifa „link deschis”.
    const onFocus = () => setPublicLinkUsed(readPublicLinkUsed(restaurantId));
    window.addEventListener("focus", onFocus);
    void getPromotions(restaurantId)
      .then((items) => {
        if (active) setPromotionsCount(items.length);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [restaurantId]);

  const checklist = useMemo(
    () =>
      buildSetupChecklist({
        restaurant: {
          name: currentRestaurant?.name,
          logoUrl: currentRestaurant?.logoUrl,
          phone: currentRestaurant?.phone,
          address: currentRestaurant?.address,
          createdAt: currentRestaurant?.createdAt,
        },
        settings: {
          updatedAt: settingsUpdatedAt,
          schedule: settings.schedule,
          acceptsDelivery: settings.acceptsDelivery,
          acceptsPickup: settings.acceptsPickup,
          acceptsCash: settings.acceptsCash,
          acceptsCard: settings.acceptsCard,
        },
        categoriesCount: categories.length,
        products,
        promotionsCount,
        ordersCount: orders.length,
        publicLinkUsed,
      }),
    [
      categories.length,
      currentRestaurant,
      orders.length,
      products,
      promotionsCount,
      publicLinkUsed,
      settings,
      settingsUpdatedAt,
    ],
  );

  if (!currentRestaurant || !settingsReady || catalogLoading || !ordersReady) {
    return null;
  }

  const withRestaurant = (href: string) =>
    profile?.role === "super_admin" ?
       `${href}${href.includes("?") ? "&" : "?"}restaurant=${currentRestaurant.id}`
      : href;

  if (checklist.allRequiredDone && !reopened) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setReopened(true)}
          className="text-xs font-bold text-slate-500 underline"
        >
          Vezi lista de configurare
        </button>
      </div>
    );
  }

  const percent = Math.round(
    (checklist.requiredDone / checklist.requiredTotal) * 100,
  );
  const showTrialDays =
    currentRestaurant.status === "trial" &&
    Boolean(currentRestaurant.trialExpiresAt) &&
    !currentRestaurant.accessLocked;

  return (
    <section className="mb-6 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">
            Primii pași
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Configurează-ți restaurantul
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {checklist.requiredDone} din {checklist.requiredTotal} pași
            obligatorii
            {showTrialDays &&
              ` · mai ai ${trialDaysLeft(currentRestaurant.trialExpiresAt)} zile de testare`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PublicMenuPreviewButton />
          {checklist.allRequiredDone && (
            <button
              type="button"
              onClick={() => setReopened(false)}
              className="min-h-11 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-600"
            >
              Ascunde
            </button>
          )}
        </div>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progres configurare"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-5 divide-y divide-slate-100">
        {checklist.steps.map((step) => (
          <li
            key={step.id}
            className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-black ${
                  step.done ?
                     "bg-emerald-500 text-white"
                    : "border-2 border-slate-200 text-transparent"
                }`}
              >
                ✓
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-black ${step.done ? "text-slate-400 line-through" : "text-slate-950"}`}
                >
                  {step.title}
                  {step.optional && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 no-underline">
                      opțional
                    </span>
                  )}
                  <span className="sr-only">{step.done ? " (făcut)" : " (de făcut)"}</span>
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {step.description}
                </p>
              </div>
            </div>
            {!step.done && (
              <Link
                href={withRestaurant(step.href)}
                className="ml-10 inline-flex min-h-11 w-fit shrink-0 items-center rounded-xl bg-blue-50 px-4 text-xs font-black text-blue-700 hover:bg-blue-100 sm:ml-0"
              >
                {step.actionLabel}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
