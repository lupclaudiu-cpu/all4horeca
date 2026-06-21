import type { DeliveryZone, RestaurantSettings, ScheduleDay } from "@/lib/types";

export const defaultSchedule: ScheduleDay[] = [
  { day: 1, enabled: true, openingTime: "10:00", closingTime: "23:30" },
  { day: 2, enabled: true, openingTime: "10:00", closingTime: "23:30" },
  { day: 3, enabled: true, openingTime: "10:00", closingTime: "23:30" },
  { day: 4, enabled: true, openingTime: "10:00", closingTime: "23:30" },
  { day: 5, enabled: true, openingTime: "10:00", closingTime: "23:30" },
  { day: 6, enabled: true, openingTime: "10:00", closingTime: "23:30" },
  { day: 0, enabled: true, openingTime: "10:00", closingTime: "23:30" },
];

export const defaultDeliveryZones: DeliveryZone[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Zona centrală",
    areas: ["centru", "central"],
    deliveryFee: 5,
    active: true,
    sortOrder: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Zona extinsă",
    areas: ["extins", "extended"],
    deliveryFee: 10,
    active: true,
    sortOrder: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Zona periferică",
    areas: ["periferie", "peripheral"],
    deliveryFee: 15,
    active: false,
    sortOrder: 2,
  },
];

export const restaurantSettings: RestaurantSettings = {
  acceptsDelivery: true,
  acceptsPickup: true,
  acceptsCash: true,
  acceptsCard: true,
  deliveryFee: 10,
  freeDeliveryThreshold: 100,
  minimumOrderValue: 0,
  estimatedDeliveryTime: "30-45 min",
  blockOrdersOutsideSchedule: true,
  schedule: defaultSchedule,
  deliveryZones: defaultDeliveryZones,
  openingTime: "10:00",
  closingTime: "23:30",
  notificationsEnabled: true,
  soundEnabled: true,
  highlightDelayedOrders: true,
};

export const unavailableRestaurantSettings: RestaurantSettings = {
  acceptsDelivery: false,
  acceptsPickup: false,
  acceptsCash: false,
  acceptsCard: false,
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  minimumOrderValue: 0,
  estimatedDeliveryTime: "",
  blockOrdersOutsideSchedule: true,
  schedule: defaultSchedule.map((day) => ({ ...day, enabled: false })),
  deliveryZones: [],
  openingTime: "00:00",
  closingTime: "00:00",
  notificationsEnabled: false,
  soundEnabled: false,
  highlightDelayedOrders: false,
};

export function isRestaurantOpen(
  settings: RestaurantSettings,
  date = new Date(),
) {
  return getRestaurantScheduleStatus(settings, date).open;
}

export function getRestaurantScheduleStatus(
  settings: RestaurantSettings,
  date = new Date(),
) {
  const currentDay = date.getDay();
  const daySettings =
    settings.schedule.find((item) => item.day === currentDay) ??
    fallbackDay(settings, currentDay);
  if (!daySettings.enabled) {
    const nextOpen = getNextOpenDay(settings, date);
    return {
      open: false,
      label: nextOpen ? `Se deschide la ${nextOpen.openingTime}` : "Închis",
      openingTime: daySettings.openingTime,
      closingTime: daySettings.closingTime,
    };
  }

  const current = date.getHours() * 60 + date.getMinutes();
  const opening = timeToMinutes(daySettings.openingTime);
  const closing = timeToMinutes(daySettings.closingTime);
  const open =
    opening === closing ?
       true
      : closing > opening ?
         current >= opening && current < closing
        : current >= opening || current < closing;

  if (open) {
    return {
      open: true,
      label: `Se închide la ${daySettings.closingTime}`,
      openingTime: daySettings.openingTime,
      closingTime: daySettings.closingTime,
    };
  }

  return {
    open: false,
    label:
      current < opening ? `Se deschide la ${daySettings.openingTime}` : "Închis",
    openingTime: daySettings.openingTime,
    closingTime: daySettings.closingTime,
  };
}

export function resolveDeliveryZone(
  settings: RestaurantSettings,
  address: string,
) {
  const normalizedAddress = address.toLocaleLowerCase("ro-RO");
  return settings.deliveryZones
    .filter((zone) => zone.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((zone) =>
      zone.areas.some((area) =>
        normalizedAddress.includes(area.toLocaleLowerCase("ro-RO").trim()),
      ),
    );
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function fallbackDay(settings: RestaurantSettings, day: number): ScheduleDay {
  return {
    day,
    enabled: true,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
  };
}

function getNextOpenDay(settings: RestaurantSettings, date: Date) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (date.getDay() + offset) % 7;
    const nextDay = settings.schedule.find((item) => item.day === day);
    if (nextDay?.enabled) return nextDay;
  }
  return null;
}
