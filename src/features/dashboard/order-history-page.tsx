"use client";

import { useState } from "react";
import { formatPrice } from "@/data/restaurant";
import {
  formatDashboardDate,
  statusStyles,
} from "@/features/dashboard/dashboard-utils";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { useOrders } from "@/features/orders/order-context";
import { sumMoney } from "@/lib/money";

type Period = "today" | "week" | "month" | "all";

const filters: Array<{ id: Period; label: string }> = [
  { id: "today", label: "Azi" },
  { id: "week", label: "Săptămâna aceasta" },
  { id: "month", label: "Luna aceasta" },
  { id: "all", label: "Toate" },
];

export function OrderHistoryPage() {
  const { orders, hydrated } = useOrders();
  const [period, setPeriod] = useState<Period>("all");
  const filteredOrders = orders.filter((order) =>
    isInsidePeriod(order.createdAt, period),
  );
  const filteredTotal = sumMoney(
    filteredOrders
      .filter((order) => order.status !== "Anulată")
      .map((order) => order.total),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Arhivă"
        title="Istoric comenzi"
        description="Consultă toate comenzile și filtrează rapid perioada analizată."
      />

      <div className="mt-7 flex flex-col gap-4 rounded-[1.5rem] border border-black/5 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setPeriod(filter.id)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                period === filter.id ?
                   "bg-[#0f172a] text-white"
                  : "bg-[#f1f5f9] text-[#64748b]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-6 text-xs">
          <span className="font-bold text-[#64748b]">
            {filteredOrders.length} comenzi
          </span>
          <span className="text-base font-black text-[#2563eb]">
            {formatPrice(filteredTotal)}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="hidden grid-cols-[1.1fr_1fr_1.2fr_.7fr_.7fr] gap-4 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-4 text-[10px] font-black uppercase tracking-wide text-[#64748b] md:grid">
          <span>Comandă</span>
          <span>Client</span>
          <span>Produse</span>
          <span>Status</span>
          <span className="text-right">Total</span>
        </div>
        {!hydrated ? (
          <div className="h-64 animate-pulse bg-[#f8fafc]" />
        ) : filteredOrders.length ? (
          <div className="divide-y divide-[#e2e8f0]">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="grid gap-3 px-5 py-5 md:grid-cols-[1.1fr_1fr_1.2fr_.7fr_.7fr] md:items-center md:gap-4"
              >
                <div>
                  <p className="text-sm font-black">{order.orderNumber}</p>
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    {formatDashboardDate(order.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">{order.customer.name}</p>
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    {order.customer.phone}
                  </p>
                </div>
                <p className="text-xs leading-5 text-[#64748b]">
                  {order.items
                    .map((item) => `${item.quantity}× ${item.name}`)
                    .join(", ")}
                </p>
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-1.5 text-[10px] font-black ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-lg font-black text-[#2563eb] md:text-right">
                  {formatPrice(order.total)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-20 text-center text-sm font-bold text-[#64748b]">
            Nu există comenzi în perioada selectată.
          </div>
        )}
      </div>
    </div>
  );
}

function isInsidePeriod(value: string, period: Period) {
  if (period === "all") return true;
  const date = new Date(value);
  const now = new Date();

  if (period === "today") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  if (period === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return date >= start;
}
