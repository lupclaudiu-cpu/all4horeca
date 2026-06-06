import type { DeliveryLocation, Order } from "@/lib/types";

const STORAGE_KEY = "all4horeca-order-locations";

type LocationMap = Record<string, DeliveryLocation>;

export function saveOrderLocation(
  orderId: string,
  location?: DeliveryLocation,
) {
  if (!location || typeof window === "undefined") return;
  const locations = readLocations();
  locations[orderId] = location;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

export function mergeOrderLocations(orders: Order[]) {
  if (typeof window === "undefined") return orders;
  const locations = readLocations();
  return orders.map((order) => {
    const deliveryLocation = locations[order.id];
    if (!deliveryLocation) return order;
    return {
      ...order,
      customer: { ...order.customer, deliveryLocation },
    };
  });
}

function readLocations(): LocationMap {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}
