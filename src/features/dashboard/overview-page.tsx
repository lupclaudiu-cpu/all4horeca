"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChartIcon,
  OrdersIcon,
  ProductsIcon,
  UserIcon,
} from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useCatalog } from "@/features/catalog/catalog-context";
import { buildDashboardAnalytics } from "@/features/dashboard/dashboard-analytics";
import {
  formatDashboardDate,
  formatOrderTimer,
  statusStyles,
} from "@/features/dashboard/dashboard-utils";
import { StatCard } from "@/features/dashboard/stat-card";
import { useOrders } from "@/features/orders/order-context";
import { sumMoney } from "@/lib/money";

export function OverviewPage() {
  const { orders, hydrated } = useOrders();
  const { products, categories } = useCatalog();
  const [clientReady, setClientReady] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      setClientReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const analytics = buildDashboardAnalytics(orders, products, categories);
  const maxSales = Math.max(...analytics.dailySales.map((day) => day.sales), 1);
  const activeProducts = products.filter(
    (product) => product.active !== false && !product.soldOut,
  ).length;
  const recurringCustomers = analytics.customers.filter(
    (customer) => customer.orders > 1,
  ).length;
  const sevenDaySales = sumMoney(analytics.dailySales.map((day) => day.sales));
  const thirtyDaySales = useMemo(() => {
    if (!now) return 0;
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    return sumMoney(
      orders
        .filter(
          (order) =>
            order.status !== "Anulată" &&
            new Date(order.createdAt).getTime() >= cutoff,
        )
        .map((order) => order.total),
    );
  }, [now, orders]);

  if (!clientReady) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="h-36 animate-pulse rounded-[2rem] bg-white" />
        <div className="mt-6 h-96 animate-pulse rounded-[2rem] bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-8">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              ALL4HORECA <span className="text-white/45">by ANTORIA</span>
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Performanța restaurantului, clară și acționabilă.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Urmărești vânzările, comenzile live, clienții și produsele care
              mișcă business-ul, dintr-un singur panou premium.
            </p>
          </div>
          <Link
            href="/restaurant/dashboard/comenzi"
            className="w-fit rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:brightness-110"
          >
            Deschide comenzile live
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Vânzări astăzi"
          value={hydrated ? formatPrice(analytics.todaySales) : "—"}
          detail="Comenzi valide, fără anulări"
          icon={<ChartIcon className="size-5" />}
          tone="green"
          accent="sales"
        />
        <StatCard
          label="Comenzi astăzi"
          value={hydrated ? String(analytics.todayOrders) : "—"}
          detail={`${analytics.activeOrders.length} comenzi active acum`}
          icon={<OrdersIcon className="size-5" />}
          tone="blue"
          accent="orders"
        />
        <StatCard
          label="Valoare medie comandă"
          value={hydrated ? formatPrice(analytics.averageOrder) : "—"}
          detail="Medie pe comenzile finalizabile"
          icon={<ChartIcon className="size-5" />}
          tone="violet"
        />
        <StatCard
          label="Timp mediu preparare"
          value={
            hydrated && analytics.averagePreparationMinutes !== null
              ? `${analytics.averagePreparationMinutes} min`
              : "—"
          }
          detail="De la acceptare la preparare"
          icon={<ProductsIcon className="size-5" />}
          tone="orange"
        />
        <StatCard
          label="Clienți activi"
          value={hydrated ? String(analytics.activeCustomers) : "—"}
          detail={`${recurringCustomers} clienți recurenți`}
          icon={<UserIcon className="size-5" />}
          tone="violet"
        />
        <StatCard
          label="Produse active"
          value={hydrated ? String(activeProducts) : "—"}
          detail={`${products.length} produse în catalog`}
          icon={<ProductsIcon className="size-5" />}
          tone="blue"
        />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <article className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">
                Vânzări
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                Ultimele 7 zile
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-right">
              <MetricMini label="7 zile" value={formatPrice(sevenDaySales)} />
              <MetricMini label="30 zile" value={formatPrice(thirtyDaySales)} />
            </div>
          </div>
          <div className="mt-8 flex h-60 items-end gap-2 sm:gap-4">
            {analytics.dailySales.map((day) => (
              <div key={day.date} className="flex h-full flex-1 flex-col justify-end">
                <div className="group relative flex flex-1 items-end rounded-t-2xl bg-slate-100">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-300 shadow-lg shadow-blue-600/10 transition duration-300 hover:brightness-110"
                    style={{
                      height: `${Math.max(7, (day.sales / maxSales) * 100)}%`,
                    }}
                  >
                    <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-2.5 py-1.5 text-[10px] font-black text-white shadow-xl group-hover:block">
                      {formatPrice(day.sales)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-center text-[10px] font-black uppercase text-slate-400">
                  {day.label}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
          <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 to-blue-950 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  Comenzi Live
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  Monitor operațional
                </h2>
              </div>
              <span className="rounded-full bg-red-500 px-3 py-2 text-xs font-black text-white">
                {analytics.activeOrders.length} active
              </span>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {analytics.activeOrders.length ? (
              analytics.activeOrders.slice(0, 6).map((order) => (
                <Link
                  key={order.id}
                  href="/restaurant/dashboard/comenzi"
                  className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {order.orderNumber} · {order.customer.name || "Client"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDashboardDate(order.createdAt)} ·{" "}
                      {formatOrderTimer(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyPanel
                title="Nu există comenzi active"
                description="Când intră o comandă nouă, va apărea instant aici."
              />
            )}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <InsightCard
          title="Produsul cel mai vândut"
          value={analytics.products[0]?.name ?? "Date în așteptare"}
          detail={
            analytics.products[0]
              ? `${analytics.products[0].quantity} buc. · ${formatPrice(
                  analytics.products[0].revenue,
                )}`
              : "Apare după primele comenzi."
          }
        />
        <InsightCard
          title="Categoria cea mai vândută"
          value={analytics.categories[0]?.name ?? "Date în așteptare"}
          detail={
            analytics.categories[0]
              ? `${analytics.categories[0].quantity} produse · ${formatPrice(
                  analytics.categories[0].revenue,
                )}`
              : "Apare după primele comenzi."
          }
        />
        <InsightCard
          title="Clienți recurenți"
          value={String(recurringCustomers)}
          detail="Clienți cu minimum două comenzi."
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <RankingCard
          eyebrow="Produse"
          title="Top produse"
          rows={analytics.products.slice(0, 5).map((product) => ({
            label: product.name,
            detail: `${product.quantity} bucăți vândute`,
            value: formatPrice(product.revenue),
          }))}
        />
        <RankingCard
          eyebrow="Categorii"
          title="Top categorii"
          rows={analytics.categories.slice(0, 5).map((category) => ({
            label: category.name,
            detail: `${category.quantity} produse comandate`,
            value: formatPrice(category.revenue),
          }))}
        />
      </section>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="absolute -right-8 -top-10 size-24 rounded-full bg-cyan-200/40 blur-2xl" />
      <p className="relative text-[11px] font-black uppercase tracking-[0.14em] text-blue-600">
        Insight comercial
      </p>
      <h3 className="relative mt-3 text-sm font-bold text-slate-500">{title}</h3>
      <p className="relative mt-2 line-clamp-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <p className="relative mt-2 text-xs font-bold text-slate-500">{detail}</p>
    </article>
  );
}

function RankingCard({
  eyebrow,
  title,
  rows,
}: {
  eyebrow: string;
  title: string;
  rows: Array<{ label: string; detail: string; value: string }>;
}) {
  return (
    <article className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{title}</h2>
      <div className="mt-5 divide-y divide-slate-200">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={row.label} className="flex items-center gap-3 py-3 first:pt-0">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-xs font-black text-white shadow-lg shadow-blue-600/20">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{row.label}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">
                  {row.detail}
                </p>
              </div>
              <span className="text-sm font-black text-slate-950">
                {row.value}
              </span>
            </div>
          ))
        ) : (
          <EmptyPanel
            title="Date în așteptare"
            description="Topul se construiește automat după primele comenzi."
          />
        )}
      </div>
    </article>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto size-10 rounded-2xl bg-white/10 ring-1 ring-white/10" />
      <p className="mt-4 text-sm font-black">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}
