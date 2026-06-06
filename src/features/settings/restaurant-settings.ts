import type { RestaurantSettings } from "@/lib/types";

export const restaurantSettings: RestaurantSettings = {
  acceptsDelivery: true,
  acceptsPickup: true,
  acceptsCash: true,
  acceptsCard: true,
  deliveryFee: 10,
  freeDeliveryThreshold: 100,
  openingTime: "10:00",
  closingTime: "23:30",
  notificationsEnabled: true,
  soundEnabled: true,
  highlightDelayedOrders: true,
};

export function isRestaurantOpen(
  settings: RestaurantSettings,
  date = new Date(),
) {
  const current = date.getHours() * 60 + date.getMinutes();
  const opening = timeToMinutes(settings.openingTime);
  const closing = timeToMinutes(settings.closingTime);

  if (opening === closing) return true;
  if (closing > opening) return current >= opening && current < closing;
  return current >= opening || current < closing;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
