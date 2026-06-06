"use client";

import { useEffect } from "react";
import { CloseIcon, OrdersIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useOrders } from "@/features/orders/order-context";

export function NewOrderToast() {
  const { newOrderNotification, dismissNewOrderNotification } = useOrders();

  useEffect(() => {
    if (!newOrderNotification) return;
    const timer = window.setTimeout(dismissNewOrderNotification, 9000);
    return () => window.clearTimeout(timer);
  }, [dismissNewOrderNotification, newOrderNotification]);

  if (!newOrderNotification) return null;

  return (
    <div className="fixed right-4 top-20 z-[100] w-[calc(100%-2rem)] max-w-sm animate-[toast-in_.25s_ease-out] overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">
      <div className="flex gap-3 p-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
          <OrdersIcon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-emerald-700">
            Comandă nouă primită
          </p>
          <p className="mt-1 truncate text-sm font-black">
            {newOrderNotification.orderNumber} ·{" "}
            {newOrderNotification.customerName}
          </p>
          <p className="mt-1 text-xs font-bold text-[#7b756f]">
            Total {formatPrice(newOrderNotification.total)}
          </p>
        </div>
        <button
          type="button"
          onClick={dismissNewOrderNotification}
          aria-label="Închide notificarea"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f5f2ef]"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
      <div className="h-1 bg-emerald-500" />
    </div>
  );
}
