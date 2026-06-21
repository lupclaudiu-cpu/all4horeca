"use client";

import Link from "next/link";
import { useEffect } from "react";
import { OrdersIcon } from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useOrders } from "@/features/orders/order-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import type { OrderStatus, PaymentMethod } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  "Nouă": "bg-[#ecfeff] text-[#0369a1]",
  "Acceptată": "bg-[#eaf4ff] text-[#1767a5]",
  "În preparare": "bg-[#fff7d9] text-[#8d6800]",
  "În livrare": "bg-[#eee9ff] text-[#6546b3]",
  "Finalizată": "bg-[#e8f8ef] text-[#197a55]",
  "Anulată": "bg-[#fdebec] text-[#b52d37]",
};

const statusIcons: Record<OrderStatus, string> = {
  "Nouă": "●",
  "Acceptată": "●",
  "În preparare": "●",
  "În livrare": "◆",
  "Finalizată": "✓",
  "Anulată": "×",
};

export function OrdersPage({
  placedOrderNumber,
}: {
  placedOrderNumber?: string;
}) {
  const {
    orders,
    hydrated,
    error,
    refreshOrders,
    orderStatusNotification,
    dismissOrderStatusNotification,
  } = useOrders();
  const { currentRestaurant } = useRestaurant();
  const menuUrl = currentRestaurant ? `/clienti/${currentRestaurant.slug}` : "/";
  const renderLoading = !hydrated && orders.length === 0;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.info("[DEBUG]", {
      component: "OrdersPage",
      hydrated,
      renderLoading,
      orders: orders.length,
      visibleOrders: orders.length,
      restaurantId: currentRestaurant?.id ?? null,
      slug: currentRestaurant?.slug ?? null,
      error,
    });
  }, [
    currentRestaurant?.id,
    currentRestaurant?.slug,
    error,
    hydrated,
    orders.length,
    renderLoading,
  ]);

  useEffect(() => {
    if (!orderStatusNotification) return;
    const timer = window.setTimeout(dismissOrderStatusNotification, 7000);
    return () => window.clearTimeout(timer);
  }, [dismissOrderStatusNotification, orderStatusNotification]);

  return (
    <main className="page-enter min-h-screen bg-[#f8fafc] px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2563eb]">
          Istoric
        </p>
        <h1 className="mt-1 text-4xl font-black tracking-[-0.05em]">
          Comenzile mele
        </h1>

        {placedOrderNumber && (
          <div className="mt-6 rounded-2xl border border-[#bee8cf] bg-[#eaf8f1] p-4 text-[#176d4d]">
            <p className="text-sm font-black">Comanda a fost trimisă cu succes.</p>
            <p className="mt-1 text-xs">
              Număr comandă: <strong>{placedOrderNumber}</strong>
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-black">Comenzile nu au putut fi sincronizate.</p>
            <p className="mt-1">{error}</p>
            <button onClick={() => void refreshOrders()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">Reîncearcă</button>
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <RenderDebugBox
            rows={[
              ["Loading", String(!hydrated)],
              ["Render loading", String(renderLoading)],
              ["Orders", String(orders.length)],
              ["Visible Orders", String(orders.length)],
              ["Restaurant", currentRestaurant?.slug ?? "-"],
              ["Error", error ?? "-"],
            ]}
          />
        )}

        {renderLoading ? (
          <div className="mt-8 space-y-4" aria-live="polite">
            <p className="rounded-2xl bg-white px-5 py-4 text-sm font-bold text-[#64748b] shadow-sm">
              Încărcăm comenzile tale...
            </p>
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-5 w-44 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="grid min-h-[65vh] place-items-center text-center">
            <div>
              <div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-[#ecfeff] text-[#2563eb]">
                <OrdersIcon className="size-11" />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em]">
                Nu ai comenzi momentan
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748b]">
                După ce plasezi prima comandă, o vei putea urmări și găsi aici.
              </p>
              <Link
                href={menuUrl}
                className="mt-7 inline-flex rounded-2xl bg-[#2563eb] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#2563eb]/20"
              >
                Vezi meniul
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] p-5">
                  <div>
                    <p className="text-xs font-bold text-[#64748b]">Comanda</p>
                    <h2 className="mt-1 text-lg font-black">{order.orderNumber}</h2>
                    <time className="mt-1 block text-xs text-[#64748b]">
                      {formatOrderDate(order.createdAt)}
                    </time>
                  </div>
                  <span
                    className={`rounded-full px-3 py-2 text-[11px] font-black ${statusStyles[order.status]}`}
                  >
                    <span aria-hidden="true">{statusIcons[order.status]}</span>{" "}
                    {order.status}
                  </span>
                </div>

                {order.acceptedAt && order.estimatedMinutes && (
                  <div className="border-b border-blue-100 bg-blue-50 px-5 py-4">
                    <p className="text-sm font-black text-blue-800">
                      Comanda a fost acceptată
                    </p>
                    <div className="mt-2 grid gap-3 text-xs text-blue-700 min-[390px]:grid-cols-2">
                      <p>
                        <span className="block font-bold text-blue-500">
                          Timp estimat
                        </span>
                        <strong>{order.estimatedMinutes} minute</strong>
                      </p>
                      <p>
                        <span className="block font-bold text-blue-500">
                          Acceptată la
                        </span>
                        <strong>{formatOrderTime(order.acceptedAt)}</strong>
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 p-5">
                  {order.items.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#f0f9ff]">
                        <SafeImage
                          src={item.image}
                          alt=""
                          fallbackLabel={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{item.name}</p>
                        <p className="text-xs text-[#64748b]">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                        {item.selectedOptions.length > 0 && (
                          <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                            {item.selectedOptions
                              .map((option) => `${option.quantity} × ${option.optionName}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                      {paymentLabel(order.paymentMethod)}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {order.orderType === "pickup" ?
                         "Ridicare din locație"
                        : `Include livrare ${formatPrice(order.deliveryFee)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#64748b]">Total</p>
                    <p className="mt-1 text-xl font-black text-[#2563eb]">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {orderStatusNotification && (
        <div
          className="fixed inset-x-4 top-5 z-[100] mx-auto max-w-sm rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl"
          role="status"
        >
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">
            Actualizare comandă
          </p>
          <p className="mt-1 text-sm font-black">
            {orderStatusNotification.orderNumber}
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            Status nou:{" "}
            <strong>{orderStatusNotification.status}</strong>
          </p>
          <button
            type="button"
            onClick={dismissOrderStatusNotification}
            className="mt-3 text-xs font-black text-blue-600"
          >
            Închide
          </button>
        </div>
      )}
    </main>
  );
}

function RenderDebugBox({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-3 text-[11px] font-bold text-slate-700">
      <p className="text-xs font-black text-blue-700">RENDER DEBUG</p>
      <dl className="mt-2 grid grid-cols-2 gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-slate-400">{label}</dt>
            <dd className="truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function paymentLabel(method: PaymentMethod) {
  return method === "cash" ? "Plată cash" : "Plată card · simulare";
}
