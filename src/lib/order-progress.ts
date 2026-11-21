import type { Order } from "./types";

export type OrderProgressStep = {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
};

const ACTIVE_FLOW = ["Nouă", "Acceptată", "În preparare", "În livrare", "Finalizată"] as const;

/** O comandă care încă se poate urmări (nu e finalizată sau anulată). */
export function isTrackableOrder(order: Pick<Order, "status">): boolean {
  return order.status !== "Finalizată" && order.status !== "Anulată";
}

/** Pașii afișați clientului, pe baza statusului setat de administrator în dashboard. */
export function getOrderProgressSteps(
  order: Pick<Order, "status" | "orderType">,
): OrderProgressStep[] {
  const pickup = order.orderType === "pickup";
  const labels: Record<(typeof ACTIVE_FLOW)[number], string> = {
    "Nouă": "Comandă primită",
    "Acceptată": "Acceptată de restaurant",
    "În preparare": "Se pregătește",
    "În livrare": pickup ? "Gata de ridicare" : "Pe drum",
    "Finalizată": pickup ? "Ridicată" : "Livrată",
  };
  const index = ACTIVE_FLOW.indexOf(order.status as (typeof ACTIVE_FLOW)[number]);
  return ACTIVE_FLOW.map((status, position) => ({
    key: status,
    label: labels[status],
    state:
      index < 0 ? "todo"
      : position < index || (position === index && status === "Finalizată") ? "done"
      : position === index ? "current"
      : "todo",
  }));
}

/** Cât din cerc se umple (0..1). Anulată = 0. */
export function getOrderProgressRatio(order: Pick<Order, "status">): number {
  const index = ACTIVE_FLOW.indexOf(order.status as (typeof ACTIVE_FLOW)[number]);
  if (index < 0) return 0;
  return (index + 1) / ACTIVE_FLOW.length;
}

/** Ora estimată (HH:MM) când restaurantul a acceptat și a dat un timp estimat. */
export function getEstimatedReadyTime(
  order: Pick<Order, "acceptedAt" | "estimatedMinutes">,
): string | null {
  if (!order.acceptedAt || !order.estimatedMinutes) return null;
  const accepted = new Date(order.acceptedAt);
  if (Number.isNaN(accepted.getTime())) return null;
  const eta = new Date(accepted.getTime() + order.estimatedMinutes * 60_000);
  return eta.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  });
}
