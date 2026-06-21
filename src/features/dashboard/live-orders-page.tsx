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

const nextActions: Partial<
  Record<OrderStatus, { label: string; status: OrderStatus }>
> = {
  "Nouă": { label: "Acceptă comandă", status: "Acceptată" },
  "Acceptată": { label: "Începe prepararea", status: "În preparare" },
  "În preparare": { label: "Pornește livrarea", status: "În livrare" },
  "În livrare": { label: "Finalizează", status: "Finalizată" },
};

const etaPresets = [15, 20, 25, 30, 40, 45];

export function LiveOrdersPage() {
  const { orders, hydrated, error, refreshOrders, updateOrderStatus } = useOrders();
  const { settings } = useRestaurantSettings();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [acceptingOrder, setAcceptingOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(0);
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
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Operațional"
        title="Comenzi live"
        description="Gestionează comenzile active și actualizează statusul pentru client."
        action={
          <div className="flex flex-wrap gap-2">
            <span className="w-fit rounded-full bg-blue-100 px-3 py-2 text-xs font-black text-blue-700">
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
              onStatusChange={(status) => {
                if (status === "Acceptată") {
                  setAcceptingOrder(order);
                  return;
                }
                void updateOrderStatus(order.id, status).catch(() => undefined);
              }}
            />
          ))
        ) : (
          <div className="col-span-full grid min-h-[55vh] place-items-center rounded-[2rem] border border-dashed border-black/10 bg-white text-center">
            <div>
              <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <OrdersIcon className="size-9" />
              </div>
              <h2 className="mt-5 text-xl font-black">Totul este la zi</h2>
              <p className="mt-2 text-sm text-[#64748b]">
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
      {acceptingOrder && (
        <AcceptanceEtaModal
          order={acceptingOrder}
          onClose={() => setAcceptingOrder(null)}
          onConfirm={async (estimatedMinutes) => {
            await updateOrderStatus(
              acceptingOrder.id,
              "Acceptată",
              estimatedMinutes,
            );
            setAcceptingOrder(null);
          }}
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
  const nextAction = nextActions[order.status];

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)] ${
        isNew
          ? "border-2 border-emerald-400 bg-emerald-50/60 ring-4 ring-emerald-500/10"
          : delayed
            ? delayLevel === "critical"
              ? "border-2 border-red-400 bg-red-50/50"
              : "border-2 border-amber-400 bg-blue-50/50"
            : "border border-black/5"
      }`}
    >
      {isNew && (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
      )}
      <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-[#64748b]">
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
                  : "text-blue-600"
                : "text-[#64748b]"
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
            <PhoneIcon className="size-4 text-[#2563eb]" />
            Sună {order.customer.phone}
          </a>
          <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#64748b]">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
            {order.orderType === "pickup" ?
               "Ridicare din locație"
              : order.customer.address}
          </p>
        </div>
        <div className="rounded-2xl bg-[#f8fafc] p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#64748b]">
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
                    <span className="mt-1 block text-[10px] font-medium text-[#64748b]">
                      {item.selectedOptions
                        .map((option) => `${option.quantity} × ${option.optionName}`)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
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

      <div className="grid gap-3 border-t border-[#e2e8f0] px-5 py-4 text-xs sm:grid-cols-3">
        <Info label="Total" value={formatPrice(order.total)} strong />
        <Info
          label={order.orderType === "pickup" ? "Ridicare" : "Livrare"}
          value={order.paymentMethod === "cash" ? "Cash" : "Card · simulare"}
        />
        <Info
          label="Observații"
          value={order.customer.notes || "Fără observații"}
        />
        {order.estimatedMinutes && (
          <Info
            label="ETA acceptat"
            value={`${order.estimatedMinutes} minute`}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#e2e8f0] bg-[#f8fafc] p-4">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-3 py-2 text-[11px] font-black text-white"
        >
          <EyeIcon className="size-4" />
          Vezi Detalii
        </button>
        {nextAction && (
          <button
            onClick={() => onStatusChange(nextAction.status)}
            className={`rounded-xl px-3 py-2 text-[11px] font-black transition ${
              nextAction.status === "Finalizată"
                ? "bg-emerald-600 text-white"
                : "border border-[#ddd6d0] bg-white text-[#4e4843]"
            }`}
          >
            {nextAction.label}
          </button>
        )}
        {order.status === "Nouă" && (
          <button
            onClick={() => onStatusChange("Anulată")}
            className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-black text-red-600"
          >
            Anulează
          </button>
        )}
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
    orange: "bg-blue-50 text-blue-700",
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
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e2e8f0] bg-white/95 p-5 backdrop-blur">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{order.orderNumber}</h2>
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusStyles[order.status]}`}>
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-[#64748b]">
              {formatDashboardDate(order.createdAt)} · {formatOrderTimer(order.createdAt, now)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f1f5f9]"
            aria-label="Închide detaliile"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className="grid gap-3 rounded-2xl bg-[#f8fafc] p-4 sm:grid-cols-2">
            <Info label="Client" value={order.customer.name} />
            <Info label="Telefon" value={order.customer.phone} />
            <Info
              label={order.orderType === "pickup" ? "Tip comandă" : "Adresă"}
              value={
                order.orderType === "pickup" ?
                   "Ridicare din locație"
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
              <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
                Locație livrare
              </p>
              <OrderMap
                destination={order.customer.deliveryLocation}
                courierLocation={order.tracking?.courierLocation}
              />
            </section>
          )}

          <section>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#2563eb]">
              Produse
            </p>
            <div className="mt-3 divide-y divide-[#e2e8f0]">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-black">{item.name}</p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.selectedOptions.map((option) => (
                          <p key={`${option.groupId}-${option.optionId}`} className="text-[11px] text-[#64748b]">
                            {option.groupName}: <strong>{option.quantity} × {option.optionName}</strong>
                            {option.priceDelta > 0 && ` (+${formatPrice(option.priceDelta)})`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-black">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e2e8f0] p-4">
            <PriceLine label="Subtotal" value={order.subtotal} />
            <PriceLine label="Taxă livrare" value={order.deliveryFee} />
            <div className="mt-3 flex justify-between border-t border-[#e2e8f0] pt-3">
              <span className="font-black">Total</span>
              <span className="text-xl font-black text-[#2563eb]">
                {formatPrice(order.total)}
              </span>
            </div>
          </section>

          {order.acceptedAt && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Timpi operaționali
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                <Info
                  label="ETA"
                  value={`${order.estimatedMinutes ?? "—"} min`}
                />
                <Info
                  label="Acceptată"
                  value={formatTimestamp(order.acceptedAt)}
                />
                <Info
                  label="Preparare"
                  value={formatTimestamp(order.preparationStartedAt)}
                />
                <Info
                  label="Livrare"
                  value={formatTimestamp(order.deliveryStartedAt)}
                />
                <Info
                  label="Finalizată"
                  value={formatTimestamp(order.completedAt)}
                />
              </div>
            </section>
          )}

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

function AcceptanceEtaModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (estimatedMinutes: number) => Promise<void>;
}) {
  const [selectedEta, setSelectedEta] = useState<number | "custom">(25);
  const [customEta, setCustomEta] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const estimatedMinutes =
    selectedEta === "custom" ? Number(customEta) : selectedEta;
  const valid = Number.isInteger(estimatedMinutes) && estimatedMinutes > 0;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const confirm = async () => {
    if (!valid) {
      setError("Introdu un timp estimat valid.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(estimatedMinutes);
    } catch (reason) {
      setError(
        reason instanceof Error ?
           reason.message
          : "Comanda nu a putut fi acceptată.",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-black/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Acceptă comanda ${order.orderNumber}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">
              Acceptare comandă
            </p>
            <h2 className="mt-1 text-2xl font-black">{order.orderNumber}</h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Selectează timpul estimat comunicat clientului.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid size-10 place-items-center rounded-full bg-[#f1f5f9]"
            aria-label="Închide"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {etaPresets.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setSelectedEta(minutes)}
              className={`rounded-2xl border px-4 py-4 text-sm font-black transition ${
                selectedEta === minutes ?
                   "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/10"
                  : "border-[#e2e8f0] bg-white text-[#475569]"
              }`}
            >
              {minutes} minute
            </button>
          ))}
        </div>

        <label className="mt-4 block rounded-2xl border border-[#e2e8f0] p-4">
          <span className="flex items-center gap-2 text-sm font-black">
            <input
              type="radio"
              checked={selectedEta === "custom"}
              onChange={() => setSelectedEta("custom")}
            />
            Alt timp
          </span>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={customEta}
              onFocus={() => setSelectedEta("custom")}
              onChange={(event) => {
                setSelectedEta("custom");
                setCustomEta(event.target.value);
              }}
              className="min-w-0 flex-1 rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm font-bold outline-none focus:border-blue-600"
              placeholder="Ex: 35"
            />
            <span className="text-sm font-bold text-[#64748b]">minute</span>
          </div>
        </label>

        {error && <p className="mt-4 text-sm font-bold text-red-600">{error}</p>}

        <button
          type="button"
          onClick={() => void confirm()}
          disabled={saving || !valid}
          className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ?
             "Se acceptă..."
            : `Confirmă ${estimatedMinutes || "—"} minute`}
        </button>
      </div>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 flex justify-between text-sm text-[#64748b]">
      <span>{label}</span>
      <span className="font-bold text-[#0f172a]">{formatPrice(value)}</span>
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
      <p className="font-bold text-[#64748b]">{label}</p>
      <p className={`mt-1 ${strong ? "text-base font-black text-[#2563eb]" : "font-bold"}`}>
        {value}
      </p>
    </div>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
