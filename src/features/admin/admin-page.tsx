"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChartIcon, ProductsIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { RestaurantWizard } from "@/features/admin/restaurant-wizard";
import type { AdminRestaurant } from "@/lib/types";
import {
  getAdminRestaurants,
  softDeleteRestaurant,
  updateRestaurantActive,
  updateRestaurantCommercialStatus,
} from "@/services/admin-service";

type StatusFilter = "all" | "trial" | "active" | "suspended" | "paid";
type SortMode = "newest" | "orders" | "revenue";

export function AdminPage() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortMode>("newest");

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

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleRestaurant = async (item: AdminRestaurant) => {
    setSavingId(item.id);
    setError(null);
    try {
      await updateRestaurantActive(item.id, !item.isActive);
      await loadRestaurants();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Actualizare eșuată.");
    } finally {
      setSavingId(null);
    }
  };

  const runTrialAction = async (
    item: AdminRestaurant,
    action: "activate" | "suspend" | "extend_trial" | "convert_paid",
  ) => {
    setSavingId(item.id);
    setError(null);
    try {
      await updateRestaurantCommercialStatus(item.id, action);
      await loadRestaurants();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Actualizare eșuată.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteRestaurant = async (item: AdminRestaurant) => {
    if (
      !window.confirm(
        `Arhivezi restaurantul "${item.name}" Datele rămân păstrate, dar restaurantul nu va mai fi activ.`,
      )
    ) {
      return;
    }
    setSavingId(item.id);
    setError(null);
    try {
      await softDeleteRestaurant(item.id);
      await loadRestaurants();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Arhivare eșuată.");
    } finally {
      setSavingId(null);
    }
  };

  const totalOrders = restaurants.reduce(
    (sum, restaurant) => sum + restaurant.orderCount,
    0,
  );
  const totalRevenue = restaurants.reduce(
    (sum, restaurant) => sum + (restaurant.totalRevenue ?? 0),
    0,
  );
  const trialRestaurants = restaurants.filter(
    (item) => item.status === "trial" || item.trialActive,
  );
  const expiringTrials = trialRestaurants.filter((item) => {
    if (!item.trialExpiresAt || now === 0) return false;
    const days = Math.ceil(
      (new Date(item.trialExpiresAt).getTime() - now) / 86_400_000,
    );
    return days >= 0 && days <= 3;
  });
  const convertedRestaurants = restaurants.filter(
    (item) => item.contractSigned,
  ).length;
  const activeRestaurants = restaurants.filter((item) => item.isActive).length;
  const suspendedRestaurants = restaurants.filter(
    (item) => item.status === "suspended",
  ).length;
  const conversionRate = restaurants.length
    ?
     Math.round((convertedRestaurants / restaurants.length) * 100)
    : 0;
  const visibleRestaurants = restaurants
    .filter((item) => {
      const matchesSearch = [
        item.name,
        item.slug,
        item.companyName,
        item.contactName,
        item.contactEmail,
        item.contactPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "trial" &&
          (item.status === "trial" || item.trialActive)) ||
        (statusFilter === "active" &&
          item.isActive &&
          item.status !== "trial" &&
          item.status !== "suspended") ||
        (statusFilter === "suspended" && item.status === "suspended") ||
        (statusFilter === "paid" && item.contractSigned);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "orders") return b.orderCount - a.orderCount;
      if (sortBy === "revenue") {
        return (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-8">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              ALL4HORECA <span className="text-white/45">by ANTORIA</span>
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Centru de control SaaS pentru restaurante.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Monitorizezi onboarding-ul, trial-urile, restaurantele active și
              performanța comercială dintr-un panou enterprise.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="w-fit rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:brightness-110"
          >
            {showForm ? "Închide formularul" : "Adaugă restaurant"}
          </button>
        </div>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminMetric
          label="Restaurante Trial"
          value={String(trialRestaurants.length)}
          icon={<ProductsIcon className="size-5" />}
          tone="blue"
        />
        <AdminMetric
          label="Restaurante Active"
          value={String(activeRestaurants)}
          icon={<ProductsIcon className="size-5" />}
          tone="green"
        />
        <AdminMetric
          label="Restaurante Suspendate"
          value={String(suspendedRestaurants)}
          icon={<ProductsIcon className="size-5" />}
          tone="amber"
        />
        <AdminMetric
          label="Restaurante Plătitoare"
          value={String(convertedRestaurants)}
          icon={<ChartIcon className="size-5" />}
          tone="violet"
        />
        <AdminMetric
          label="Comenzi totale"
          value={String(totalOrders)}
          icon={<ChartIcon className="size-5" />}
          tone="blue"
        />
        <AdminMetric
          label="Vânzări totale"
          value={formatPrice(totalRevenue)}
          icon={<ChartIcon className="size-5" />}
          tone="green"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
            Flux de onboarding
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <FunnelStep
              label="Perioadă gratuită"
              value={trialRestaurants.length}
            />
            <FunnelStep label="Transformate" value={convertedRestaurants} />
            <FunnelStep label="Expiră curând" value={expiringTrials.length} />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-[0_18px_55px_rgba(37,99,235,0.18)]">
          <div className="absolute -right-8 -top-10 size-28 rounded-full bg-white/20 blur-2xl" />
          <p className="relative text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            Conversie către client
          </p>
          <p className="relative mt-2 text-4xl font-black">
            {conversionRate}%
          </p>
          <p className="relative mt-2 text-sm font-bold text-blue-50">
            Restaurante transformate în clienți activi.
          </p>
        </div>
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

      <section className="mt-6 rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Caută restaurant
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Caută după restaurant, firmă, contact sau email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 xl:w-52"
            >
              <option value="all">Toate</option>
              <option value="trial">Perioadă gratuită</option>
              <option value="active">Active</option>
              <option value="suspended">Suspendate</option>
              <option value="paid">Plătitoare</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Sortare
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortMode)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 xl:w-52"
            >
              <option value="newest">Cele mai noi</option>
              <option value="orders">Cele mai multe comenzi</option>
              <option value="revenue">Cele mai mari vânzări</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
            Comercial
          </p>
          <h2 className="mt-1 text-xl font-black">
            Restaurante în perioadă gratuită
          </h2>
        </div>
        {loading ? (
          <div className="h-48 animate-pulse bg-slate-50" />
        ) : trialRestaurants.length ? (
          <div className="divide-y divide-slate-200">
            {trialRestaurants.map((item) => (
              <TrialRestaurantRow
                key={item.id}
                item={item}
                saving={savingId === item.id}
                now={now}
                onAction={runTrialAction}
                onDelete={deleteRestaurant}
              />
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm font-bold text-slate-500">
            Nu există restaurante în perioada gratuită.
          </p>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/50 p-5">
          <h2 className="text-xl font-black">Lista restaurantelor</h2>
        </div>
        {loading ? (
          <div className="h-72 animate-pulse bg-slate-50" />
        ) : visibleRestaurants.length ? (
          <div className="divide-y divide-slate-200">
            {visibleRestaurants.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 p-5 transition hover:bg-blue-50/30 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-12 place-items-center rounded-xl text-xs font-black text-white"
                    style={{ backgroundColor: item.primaryColor }}
                  >
                    {item.name.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{item.name}</h3>
                      <StatusPill status={item.status} paid={item.contractSigned} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">/{item.slug}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:block">
                  <p className="text-xs font-bold text-slate-500">Comenzi</p>
                  <p className="mt-1 text-lg font-black">{item.orderCount}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500 sm:mt-3">
                    Vânzări
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {formatPrice(item.totalRevenue ?? 0)}
                  </p>
                </div>
                <Link
                  href={`/admin/restaurante/${item.id}`}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-center text-xs font-black text-white shadow-md transition hover:bg-blue-700"
                >
                  Deschide
                </Link>
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => void toggleRestaurant(item)}
                  className={`rounded-xl px-4 py-3 text-xs font-black ${
                    item.isActive ?
                       "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {savingId === item.id ?
                     "Se salvează..."
                    : item.isActive ?
                       "Activ"
                      : "Inactiv"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="p-10 text-center text-sm font-bold text-slate-500">
            Nu există restaurante pentru filtrele selectate.
          </p>
        )}
      </section>
    </div>
  );
}

function TrialRestaurantRow({
  item,
  saving,
  now,
  onAction,
  onDelete,
}: {
  item: AdminRestaurant;
  saving: boolean;
  now: number;
  onAction: (
    item: AdminRestaurant,
    action: "activate" | "suspend" | "extend_trial" | "convert_paid",
  ) => Promise<void>;
  onDelete: (item: AdminRestaurant) => Promise<void>;
}) {
  const trialState = getTrialState(item, now);

  return (
    <article className="grid gap-4 p-5 transition hover:bg-blue-50/30 xl:grid-cols-[1.15fr_1fr_.8fr_auto] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black">{item.name}</h3>
          <StatusPill status={item.status} paid={item.contractSigned} />
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${trialState.className}`}>
            {trialState.label}
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {item.companyName || "Companie necompletată"} ·{" "}
          {item.city || "oraș necompletat"}
        </p>
        <p className="mt-1 text-xs text-slate-400">/{item.slug}</p>
      </div>
      <div className="grid gap-1 text-xs text-slate-500">
        <span>
          <strong className="text-slate-800">Contact:</strong>{" "}
          {item.contactName || "-"}
        </span>
        <span>
          <strong className="text-slate-800">Telefon:</strong>{" "}
          {item.contactPhone || "-"}
        </span>
        <span>
          <strong className="text-slate-800">Email:</strong>{" "}
          {item.contactEmail || "-"}
        </span>
      </div>
      <div className="grid gap-1 text-xs text-slate-500">
        <span>
          <strong className="text-slate-800">Creat:</strong>{" "}
          {formatDate(item.createdAt)}
        </span>
        <span>
          <strong className="text-slate-800">Expiră:</strong>{" "}
          {formatDate(item.trialExpiresAt)}
        </span>
        <span>
          <strong className="text-slate-800">Rămase:</strong>{" "}
          {formatDaysRemaining(item.trialExpiresAt, now)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        <TrialButton
          disabled={saving}
          onClick={() => void onAction(item, "activate")}
        >
          Activează
        </TrialButton>
        <TrialButton
          disabled={saving}
          onClick={() => void onAction(item, "suspend")}
        >
          Suspendă
        </TrialButton>
        <TrialButton
          disabled={saving}
          onClick={() => void onAction(item, "extend_trial")}
        >
          Extinde perioada
        </TrialButton>
        <TrialButton
          disabled={saving}
          onClick={() => void onAction(item, "convert_paid")}
        >
          Transformă în client
        </TrialButton>
        <TrialButton danger disabled={saving} onClick={() => void onDelete(item)}>
          Arhivează
        </TrialButton>
      </div>
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDaysRemaining(value: string | null | undefined, now: number) {
  if (!value || now === 0) return "-";
  const days = Math.ceil((new Date(value).getTime() - now) / 86_400_000);
  return days < 0 ? "expirat" : `${days} zile`;
}

function getTrialState(item: AdminRestaurant, now: number) {
  if (item.contractSigned) {
    return {
      label: "client plătitor",
      className: "bg-emerald-100 text-emerald-700",
    };
  }
  if (!item.trialActive) {
    return {
      label: "trial inactiv",
      className: "bg-slate-100 text-slate-600",
    };
  }
  if (!item.trialExpiresAt || now === 0) {
    return {
      label: "trial activ",
      className: "bg-blue-100 text-blue-700",
    };
  }
  const days = Math.ceil((new Date(item.trialExpiresAt).getTime() - now) / 86_400_000);
  if (days < 0) {
    return {
      label: "trial expirat",
      className: "bg-red-100 text-red-700",
    };
  }
  if (days <= 3) {
    return {
      label: `expiră în ${days} zile`,
      className: "bg-amber-100 text-amber-700",
    };
  }
  return {
    label: "trial activ",
    className: "bg-blue-100 text-blue-700",
  };
}

function StatusPill({ status, paid }: { status?: string; paid?: boolean }) {
  if (paid) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
        plătitor
      </span>
    );
  }
  const label = status || "active";
  const translated =
    label === "trial" ?
       "perioadă gratuită"
      : label === "suspended" ?
         "suspendat"
        : label === "deleted" ?
           "arhivat"
          : "activ";
  const className =
    label === "trial" ?
       "bg-blue-50 text-blue-700"
      : label === "suspended" ?
         "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${className}`}
    >
      {translated}
    </span>
  );
}

function TrialButton({
  children,
  disabled,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-[11px] font-black disabled:cursor-wait disabled:opacity-60 ${
        danger ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function AdminMetric({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "violet";
}) {
  const tones = {
    blue: "from-slate-950 to-blue-950 text-cyan-200",
    green: "from-slate-950 to-emerald-950 text-emerald-200",
    amber: "from-slate-950 to-amber-950 text-amber-200",
    violet: "from-slate-950 to-violet-950 text-violet-200",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-5 text-white shadow-xl shadow-slate-950/10 ${tones[tone]}`}>
      <div className="absolute -right-8 -top-10 size-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <p className="text-xs font-bold text-white/70">{label}</p>
        {icon}
      </div>
      <p className="relative mt-3 text-3xl font-black tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
