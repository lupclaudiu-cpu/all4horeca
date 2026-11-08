import type { Order } from "@/lib/types";

export type Range = { start: Date; end: Date };

const WEEKDAYS = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function inRange(order: Order, range: Range) {
  const t = new Date(order.createdAt);
  return t >= range.start && t < range.end;
}

export function previousRange(range: Range): Range {
  const length = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - length), end: range.start };
}

function totals(orders: Order[]) {
  const valid = orders.filter((o) => o.status !== "Anulată");
  const sales = valid.reduce((sum, o) => sum + o.total, 0);
  return { count: valid.length, sales: Math.round(sales * 100) / 100 };
}

function pct(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function buildInsights(orders: Order[], range: Range) {
  const current = orders.filter((o) => inRange(o, range));
  const previous = orders.filter((o) => inRange(o, previousRange(range)));
  const valid = current.filter((o) => o.status !== "Anulată");
  const cur = totals(current);
  const prev = totals(previous);

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));
  const weekdays = WEEKDAYS.map((label) => ({ label, orders: 0, sales: 0 }));
  valid.forEach((o) => {
    const d = new Date(o.createdAt);
    hours[d.getHours()].orders += 1;
    weekdays[d.getDay()].orders += 1;
    weekdays[d.getDay()].sales += o.total;
  });

  const share = (predicate: (o: Order) => boolean) => {
    const n = valid.filter(predicate).length;
    return { count: n, percent: valid.length ? Math.round((n / valid.length) * 100) : 0 };
  };
  const cancelled = current.filter((o) => o.status === "Anulată").length;

  return {
    current: cur,
    previous: prev,
    ordersChange: pct(cur.count, prev.count),
    salesChange: pct(cur.sales, prev.sales),
    hours,
    weekdays,
    peakHour: hours.reduce((a, b) => (b.orders > a.orders ? b : a)),
    delivery: share((o) => o.orderType === "delivery"),
    pickup: share((o) => o.orderType === "pickup"),
    cash: share((o) => o.paymentMethod === "cash"),
    card: share((o) => o.paymentMethod === "card"),
    cancelled,
    cancelRate: current.length ? Math.round((cancelled / current.length) * 1000) / 10 : 0,
  };
}
