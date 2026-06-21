import type { Order, OrderStatus } from "@/lib/types";
import { fromCents, sumMoney, toCents } from "@/lib/money";

export const activeStatuses: OrderStatus[] = [
  "Nouă",
  "Acceptată",
  "În preparare",
  "În livrare",
];

export const statusStyles: Record<OrderStatus, string> = {
  "Nouă": "bg-red-100 text-red-700 ring-1 ring-red-200",
  "Acceptată": "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "În preparare": "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  "În livrare": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "Finalizată": "bg-teal-100 text-teal-700 ring-1 ring-teal-200",
  "Anulată": "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

export const isToday = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const formatDashboardDate = (value: string) =>
  new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const getOrderAgeMinutes = (value: string, now = Date.now()) =>
  Math.max(0, Math.floor((now - new Date(value).getTime()) / 60_000));

export const isOrderDelayed = (order: Order, now = Date.now()) =>
  activeStatuses.includes(order.status) &&
  getOrderAgeMinutes(order.createdAt, now) >= 30;

export const getOrderDelayLevel = (
  order: Order,
  now = Date.now(),
): "normal" | "warning" | "critical" => {
  if (!activeStatuses.includes(order.status)) return "normal";
  const minutes = getOrderAgeMinutes(order.createdAt, now);
  if (minutes >= 45) return "critical";
  if (minutes >= 30) return "warning";
  return "normal";
};

export const formatOrderTimer = (value: string, now = Date.now()) => {
  const minutes = getOrderAgeMinutes(value, now);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

export const calculateOrderMetrics = (orders: Order[]) => {
  const completed = orders.filter((order) => order.status !== "Anulată");
  const totalSales = sumMoney(completed.map((order) => order.total));
  const productTotals = new Map<string, number>();

  completed.forEach((order) => {
    order.items.forEach((item) => {
      productTotals.set(
        item.name,
        (productTotals.get(item.name) ?? 0) + item.quantity,
      );
    });
  });

  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    totalSales,
    orderCount: orders.length,
    averageOrder: completed.length ?
       fromCents(Math.round(toCents(totalSales) / completed.length))
      : 0,
    topProducts,
  };
};
