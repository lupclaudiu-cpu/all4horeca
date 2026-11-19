import type { Order } from "@/lib/types";

/** Eticheta afișată pentru statusul comenzii. Comenzile de ridicare nu sunt „în livrare”. */
export function orderStatusLabel(
  order: Pick<Order, "status" | "orderType">,
): string {
  if (order.status === "În livrare" && order.orderType === "pickup") {
    return "Gata de ridicare";
  }
  return order.status;
}
