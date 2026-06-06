"use client";

import Image from "next/image";
import Link from "next/link";
import { OrdersIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useOrders } from "@/features/orders/order-context";
import {
  ORDER_STATUSES,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  "Nouă": "bg-[#fff1e9] text-[#d9470d]",
  "Acceptată": "bg-[#eaf4ff] text-[#1767a5]",
  "În preparare": "bg-[#fff7d9] text-[#8d6800]",
  "În livrare": "bg-[#eee9ff] text-[#6546b3]",
  "Finalizată": "bg-[#e8f8ef] text-[#197a55]",
  "Anulată": "bg-[#fdebec] text-[#b52d37]",
};

export function OrdersPage({
  placedOrderNumber,
}: {
  placedOrderNumber?: string;
}) {
  const { orders, hydrated, error, refreshOrders, updateOrderStatus } = useOrders();

  return (
    <main className="page-enter min-h-screen bg-[#f8f5f2] px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">
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

        {!hydrated ? (
          <div className="mt-8 space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-[1.75rem] bg-white"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="grid min-h-[65vh] place-items-center text-center">
            <div>
              <div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-[#fff1e9] text-[#ff5a1f]">
                <OrdersIcon className="size-11" />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em]">
                Nu ai comenzi momentan
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7a746e]">
                După ce plasezi prima comandă, o vei putea urmări și găsi aici.
              </p>
              <Link
                href="/"
                className="mt-7 inline-flex rounded-2xl bg-[#ff5a1f] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#ff5a1f]/20"
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
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_35px_rgba(32,21,13,0.06)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#eee9e4] p-5">
                  <div>
                    <p className="text-xs font-bold text-[#8b8580]">Comanda</p>
                    <h2 className="mt-1 text-lg font-black">{order.orderNumber}</h2>
                    <time className="mt-1 block text-xs text-[#8b8580]">
                      {formatOrderDate(order.createdAt)}
                    </time>
                  </div>
                  <span
                    className={`rounded-full px-3 py-2 text-[11px] font-black ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  {order.items.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#fff6ec]">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{item.name}</p>
                        <p className="text-xs text-[#8b8580]">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                        {item.selectedOptions.length > 0 && (
                          <p className="mt-1 text-[10px] leading-4 text-[#8b8580]">
                            {item.selectedOptions
                              .map((option) => option.optionName)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold">
                        {formatPrice(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-[#eee9e4] bg-[#fcfaf8] px-5 py-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b8580]">
                      {paymentLabel(order.paymentMethod)}
                    </p>
                    <p className="mt-1 text-xs text-[#8b8580]">
                      {order.orderType === "pickup"
                        ? "Ridicare din locație"
                        : `Include livrare ${formatPrice(order.deliveryFee)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#8b8580]">Total</p>
                    <p className="mt-1 text-xl font-black text-[#ff5a1f]">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-[#eee9e4] px-5 py-4">
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-xs font-black">Status demo</span>
                      <span className="mt-1 block text-[11px] text-[#8b8580]">
                        Simulează actualizarea restaurantului
                      </span>
                    </span>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        void updateOrderStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        )
                      }
                      className="max-w-40 rounded-xl border border-[#e6e0db] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#ff5a1f]"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function paymentLabel(method: PaymentMethod) {
  return method === "cash" ? "Plată cash" : "Plată card · simulare";
}
