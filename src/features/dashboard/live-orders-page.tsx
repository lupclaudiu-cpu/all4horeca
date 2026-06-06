"use client";

import { useEffect, useState } from "react";
import {
  CloseIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  OrdersIcon,
  PhoneIcon,
} from "@/components/icons";
import { OrderMap } from "@/components/order-map";
import { formatPrice } from "@/data/restaurant";
import {
  activeStatuses,
  formatOrderTimer,
  formatDashboardDate,
  getOrderDelayLevel,
  isOrderDelayed,
  isToday,
  statusStyles,
} from "@/features/dashboard/dashboard-utils";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { useOrders } from "@/features/orders/order-context";
import type { Order, OrderStatus } from "@/lib/types";
import { useRestaurantSettings } from "@/features/settings/settings-context";

const actions: Array<{ label: string; status: OrderStatus }> = [
  { label: "Acceptă", status: "Acceptată" },
  { label: "În preparare", status: "În preparare" },
  { label: "În livrare", status: "În livrare" },
  { label: "Finalizată", status: "Finalizată" },
];

export function LiveOrdersPage() {
  const { orders, hydrated, error, refreshOrders, updateOrderStatus } = useOrders();
  const { settings } = useRestaurantSettings();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const liveOrders = orders.filter((order) =>
    activeStatuses.includes(order.status),
  );
  const delayedOrders = liveOrders.filter((order) =>
    isOrderDelayed(order, now),
  );
  const newOrders = liveOrders.filter((order) => order.status === "Nouă");
  const preparingOrders = liveOrders.filter(
    (order) => order.status === "În preparare",
  );
  const deliveringOrders = liveOrders.filter(
    (order) => order.status === "În livrare",
  );
  const completedToday = orders.filter(
    (order) => order.status === "Finalizată" && isToday(order.createdAt),
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Operațional"
        title="Comenzi live"
        description="Gestionează comenzile active și actualizează statusul pentru client."
        action={
          <div className="flex flex-wrap gap-2">
            <span className="w-fit rounded-full bg-orange-100 px-3 py-2 text-xs font-black text-orange-700">
              {liveOrders.length} active
            </span>
            <span className="w-fit rounded-full bg-red-100 px-3 py-2 text-xs font-black text-red-700">
              {delayedOrders.length} întârziate
            </span>
          </div>
        }
      />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <LiveMetric label="Comenzi Noi" value={newOrders.length} tone="red" />
        <LiveMetric label="În Preparare" value={preparingOrders.length} tone="orange" />
        <LiveMetric label="În Livrare" value={deliveringOrders.length} tone="violet" />
        <LiveMetric label="Finalizate Azi" value={completedToday.length} tone="green" />
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-black">Comenzile nu au putut fi sincronizate.</p>
          <p className="mt-1">{error}</p>
          <button onClick={() => void refreshOrders()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">Reîncearcă</button>
        </div>
      )}

      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        {!hydrated ? (
          [1, 2].map((item) => (
            <div
              key={item}
              className="h-96 animate-pulse rounded-[1.75rem] bg-white"
            />
          ))
        ) : liveOrders.length ? (
          liveOrders.map((order) => (
            <LiveOrderCard
              key={order.id}
              order={order}
              now={now}
              highlightDelayed={settings.highlightDelayedOrders}
              onOpen={() => setSelectedOrder(order)}
              onStatusChange={(status) => void updateOrderStatus(order.id, status)}
            />
          ))
        ) : (
          <div className="col-span-full grid min-h-[55vh] place-items-center rounded-[2rem] border border-dashed border-black/10 bg-white text-center">
            <div>
              <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <OrdersIcon className="size-9" />
              </div>
              <h2 className="mt-5 text-xl font-black">Totul este la zi</h2>
              <p className="mt-2 text-sm text-[#8b8580]">
                Nu există comenzi active momentan.
              </p>
            </div>
          </div>
        )}
      </div>
      {selectedOrder && (
        <OrderDetailsModal
          order={
            orders.find((order) => order.id === selectedOrder.id) ??
            selectedOrder
          }
          now={now}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function LiveOrderCard({
  order,
  now,
  highlightDelayed,
  onOpen,
  onStatusChange,
}: {
  order: Order;
  now: number;
  highlightDelayed: boolean;
  onOpen: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const delayLevel = getOrderDelayLevel(order, now);
  const delayed = highlightDelayed && delayLevel !== "normal";
  const isNew = order.status === "Nouă";

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_35px_rgba(24,18,12,0.05)] ${
        isNew
          ? "border-2 border-emerald-400 bg-emerald-50/60 ring-4 ring-emerald-500/10"
          : delayed
            ? delayLevel === "critical"
              ? "border-2 border-red-400 bg-red-50/50"
              : "border-2 border-orange-400 bg-orange-50/50"
            : "border border-black/5"
      }`}
    >
      {isNew && (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
      )}
      <div className="flex items-start justify-between gap-4 border-b border-[#eee9e4] p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-[#8b8580]">
              {formatDashboardDate(order.createdAt)}
            </p>
            {isNew && (
              <span className="animate-pulse rounded-full bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                Comandă nouă
              </span>
            )}
          </div>
          <h2 className="mt-1 text-xl font-black">{order.orderNumber}</h2>
        </div>
        <div className="text-right">
          <span
            className={`inline-block rounded-full px-3 py-2 text-[11px] font-black ${statusStyles[order.status]}`}
          >
            {order.status}
          </span>
          <p
            className={`mt-2 flex items-center justify-end gap-1 text-xs font-black ${
              delayed
                ? delayLevel === "critical"
                  ? "text-red-600"
                  : "text-orange-600"
                : "text-[#6f6862]"
            }`}
          >
            <ClockIcon className="size-4" />
            {formatOrderTimer(order.createdAt, now)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <p className="text-sm font-black">{order.customer.name}</p>
          <a
            href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}
            className="mt-2 flex w-fit items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
          >
            <PhoneIcon className="size-4 text-[#ff5a1f]" />
            Sună {order.customer.phone}
          </a>
          <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#6f6862]">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-[#ff5a1f]" />
            {order.orderType === "pickup"
              ? "Ridicare din locație"
              : order.customer.address}
          </p>
        </div>
        <div className="rounded-2xl bg-[#f8f5f2] p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#8b8580]">
            Produse
          </p>
          <div className="mt-2 space-y-2">
            {order.items.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-3 text-xs"
              >
                <span className="font-bold">
                  {item.quantity} × {item.name}
                  {item.selectedOptions.length > 0 && (
                    <span className="mt-1 block text-[10px] font-medium text-[#8b8580]">
                      {item.selectedOptions
                        .map((option) => option.optionName)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <span>{formatPrice(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {order.orderType === "delivery" && (
        <div className="px-5 pb-5">
          <OrderMap
            destination={order.customer.deliveryLocation}
            courierLocation={order.tracking?.courierLocation}
            compact
          />
        </div>
      )}

      <div className="grid gap-3 border-t border-[#eee9e4] px-5 py-4 text-xs sm:grid-cols-3">
        <Info label="Total" value={formatPrice(order.total)} strong />
        <Info
          label={order.orderType === "pickup" ? "Ridicare" : "Livrare"}
          value={order.paymentMethod === "cash" ? "Cash" : "Card · simulare"}
        />
        <Info
          label="Observații"
          value={order.customer.notes || "Fără observații"}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#eee9e4] bg-[#fcfaf8] p-4">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#171411] px-3 py-2 text-[11px] font-black text-white"
        >
          <EyeIcon className="size-4" />
          Vezi Detalii
        </button>
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => onStatusChange(action.status)}
            disabled={order.status === action.status}
            className={`rounded-xl px-3 py-2 text-[11px] font-black transition disabled:opacity-40 ${
              action.status === "Finalizată"
                ? "bg-emerald-600 text-white"
                : "border border-[#ddd6d0] bg-white text-[#4e4843]"
            }`}
          >
            {action.label}
          </button>
        ))}
        <button
          onClick={() => onStatusChange("Anulată")}
          className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-black text-red-600"
        >
          Anulează
        </button>
      </div>
    </article>
  );
}

function LiveMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "orange" | "violet" | "green";
}) {
  const tones = {
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <p className="text-xs font-black">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function OrderDetailsModal({
  order,
  now,
  onClose,
}: {
  order: Order;
  now: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-end bg-black/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalii comandă ${order.orderNumber}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#eee9e4] bg-white/95 p-5 backdrop-blur">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{order.orderNumber}</h2>
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusStyles[order.status]}`}>
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-[#8b8580]">
              {formatDashboardDate(order.createdAt)} · {formatOrderTimer(order.createdAt, now)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f5f2ef]"
            aria-label="Închide detaliile"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className="grid gap-3 rounded-2xl bg-[#f8f5f2] p-4 sm:grid-cols-2">
            <Info label="Client" value={order.customer.name} />
            <Info label="Telefon" value={order.customer.phone} />
            <Info
              label={order.orderType === "pickup" ? "Tip comandă" : "Adresă"}
              value={
                order.orderType === "pickup"
                  ? "Ridicare din locație"
                  : order.customer.address
              }
            />
            <Info
              label="Plată"
              value={order.paymentMethod === "cash" ? "Cash" : "Card · simulare"}
            />
          </section>

          {order.orderType === "delivery" && (
            <section>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
                Locație livrare
              </p>
              <OrderMap
                destination={order.customer.deliveryLocation}
                courierLocation={order.tracking?.courierLocation}
              />
            </section>
          )}

          <section>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">
              Produse
            </p>
            <div className="mt-3 divide-y divide-[#eee9e4]">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-black">{item.name}</p>
                    <p className="mt-1 text-xs text-[#8b8580]">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.selectedOptions.map((option) => (
                          <p key={`${option.groupId}-${option.optionId}`} className="text-[11px] text-[#6f6862]">
                            {option.groupName}: <strong>{option.optionName}</strong>
                            {option.priceDelta > 0 && ` (+${formatPrice(option.priceDelta)})`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-black">
                    {formatPrice(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#eee9e4] p-4">
            <PriceLine label="Subtotal" value={order.subtotal} />
            <PriceLine label="Taxă livrare" value={order.deliveryFee} />
            <div className="mt-3 flex justify-between border-t border-[#eee9e4] pt-3">
              <span className="font-black">Total</span>
              <span className="text-xl font-black text-[#ff5a1f]">
                {formatPrice(order.total)}
              </span>
            </div>
          </section>

          <section className="rounded-2xl bg-[#fff8ed] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[#9a6517]">
              Observații
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5f4a2a]">
              {order.customer.notes || "Fără observații"}
            </p>
          </section>

          <a
            href={`tel:${order.customer.phone.replace(/[^\d+]/g, "")}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white"
          >
            <PhoneIcon className="size-5" />
            Sună clientul
          </a>
        </div>
      </div>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 flex justify-between text-sm text-[#6f6862]">
      <span>{label}</span>
      <span className="font-bold text-[#171411]">{formatPrice(value)}</span>
    </div>
  );
}

function Info({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="font-bold text-[#8b8580]">{label}</p>
      <p className={`mt-1 ${strong ? "text-base font-black text-[#ff5a1f]" : "font-bold"}`}>
        {value}
      </p>
    </div>
  );
}
