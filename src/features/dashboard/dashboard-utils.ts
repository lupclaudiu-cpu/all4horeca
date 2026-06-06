import type { Order, OrderStatus } from "@/lib/types";

export const activeStatuses: OrderStatus[] = [
  "Nouă",
  "Acceptată",
  "În preparare",
  "În livrare",
];

export const statusStyles: Record<OrderStatus, string> = {
  "Nouă": "bg-orange-100 text-orange-700",
  "Acceptată": "bg-blue-100 text-blue-700",
  "În preparare": "bg-amber-100 text-amber-700",
  "În livrare": "bg-violet-100 text-violet-700",
  "Finalizată": "bg-emerald-100 text-emerald-700",
  "Anulată": "bg-red-100 text-red-700",
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
  const totalSales = completed.reduce((sum, order) => sum + order.total, 0);
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
    averageOrder: completed.length ? totalSales / completed.length : 0,
    topProducts,
  };
};
