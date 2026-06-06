"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChartIcon,
  OrdersIcon,
  ProductsIcon,
  UserIcon,
} from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import {
  activeStatuses,
  calculateOrderMetrics,
  formatDashboardDate,
  isOrderDelayed,
  isToday,
  statusStyles,
} from "@/features/dashboard/dashboard-utils";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { StatCard } from "@/features/dashboard/stat-card";
import { useOrders } from "@/features/orders/order-context";
import { useCatalog } from "@/features/catalog/catalog-context";

export function OverviewPage() {
  const { orders, hydrated } = useOrders();
  const { products, categories } = useCatalog();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    const timer = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 30_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);
  const todayOrders = orders.filter((order) => isToday(order.createdAt));
  const activeOrders = orders.filter((order) =>
    activeStatuses.includes(order.status),
  );
  const delayedOrders = activeOrders.filter((order) =>
    isOrderDelayed(order, now),
  );
  const revenueToday = todayOrders
    .filter((order) => order.status !== "Anulată")
    .reduce((sum, order) => sum + order.total, 0);
  const newCustomers = new Set(todayOrders.map((order) => order.customer.phone))
    .size;
  const metrics = calculateOrderMetrics(orders);
  const maxTopProduct = Math.max(
    ...metrics.topProducts.map(([, quantity]) => quantity),
    1,
  );
  const categoryTotals = categories
    .map((category) => ({
      name: category.name,
      quantity: orders.reduce(
        (total, order) =>
          total +
          order.items
            .filter(
              (item) =>
                products.find((product) => product.id === item.productId)
                  ?.categoryId === category.id,
            )
            .reduce((sum, item) => sum + item.quantity, 0),
        0,
      ),
    }))
    .filter((category) => category.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Overview"
        title="Bun venit în dashboard"
        description="Monitorizează activitatea restaurantului și gestionează comenzile dintr-un singur loc."
        action={
          <Link
            href="/restaurant/dashboard/comenzi"
            className="inline-flex w-fit rounded-xl bg-[#171411] px-4 py-3 text-xs font-black text-white"
          >
            Vezi comenzile live
          </Link>
        }
      />

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-5">
        <StatCard
          label="Comenzi azi"
          value={hydrated ? String(todayOrders.length) : "—"}
          detail="Comenzi plasate astăzi"
          icon={<OrdersIcon className="size-5" />}
        />
        <StatCard
          label="Încasări azi"
          value={hydrated ? formatPrice(revenueToday) : "—"}
          detail="Fără comenzile anulate"
          icon={<ChartIcon className="size-5" />}
          tone="green"
        />
        <StatCard
          label="Comenzi active"
          value={hydrated ? String(activeOrders.length) : "—"}
          detail="Necesită atenția echipei"
          icon={<ProductsIcon className="size-5" />}
          tone="blue"
        />
        <StatCard
          label="Comenzi întârziate"
          value={hydrated ? String(delayedOrders.length) : "—"}
          detail="Active de peste 30 minute"
          icon={<OrdersIcon className="size-5" />}
        />
        <StatCard
          label="Clienți noi"
          value={hydrated ? String(newCustomers) : "—"}
          detail="Clienți unici astăzi"
          icon={<UserIcon className="size-5" />}
          tone="violet"
        />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(24,18,12,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff5a1f]">
                Activitate
              </p>
              <h2 className="mt-1 text-xl font-black">Comenzi recente</h2>
            </div>
            <Link
              href="/restaurant/dashboard/istoric"
              className="text-xs font-black text-[#ff5a1f]"
            >
              Vezi toate
            </Link>
          </div>
          <div className="mt-5">
            {!hydrated ? (
              <div className="h-44 animate-pulse rounded-2xl bg-[#f5f2ef]" />
            ) : orders.length ? (
              <div className="divide-y divide-[#eee9e4]">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f2ef] text-xs font-black">
                      {order.customer.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {order.orderNumber} · {order.customer.name}
                      </p>
                      <p className="mt-1 text-[11px] text-[#8b8580]">
                        {formatDashboardDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{formatPrice(order.total)}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-[9px] font-black ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMini text="Nu există comenzi încă." />
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(24,18,12,0.04)] sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff5a1f]">
            Top produse
          </p>
          <h2 className="mt-1 text-xl font-black">Cele mai comandate</h2>
          <div className="mt-6 space-y-5">
            {metrics.topProducts.length ? (
              metrics.topProducts.map(([name, quantity], index) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black">
                      {index + 1}. {name}
                    </span>
                    <span className="font-bold text-[#8b8580]">
                      {quantity} buc.
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0ece8]">
                    <div
                      className="h-full rounded-full bg-[#ff5a1f]"
                      style={{ width: `${(quantity / maxTopProduct) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyMini text="Topul va apărea după prima comandă." />
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniMetric
          label="Total vânzări"
          value={formatPrice(metrics.totalSales)}
        />
        <MiniMetric label="Număr comenzi" value={String(metrics.orderCount)} />
        <MiniMetric
          label="Valoare medie"
          value={formatPrice(metrics.averageOrder)}
        />
      </section>
      <section className="mt-6 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff5a1f]">
          Top categorii
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categoryTotals.length ? (
            categoryTotals.map((category, index) => (
              <span key={category.name} className="rounded-full bg-[#f8f5f2] px-4 py-3 text-xs font-black">
                {index + 1}. {category.name} · {category.quantity} buc.
              </span>
            ))
          ) : (
            <p className="text-xs font-bold text-[#8b8580]">
              Topul va apărea după primele comenzi.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#171411] p-5 text-white">
      <p className="text-xs font-bold text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-[#f8f5f2] px-4 py-8 text-center text-xs font-bold text-[#8b8580]">
      {text}
    </div>
  );
}
