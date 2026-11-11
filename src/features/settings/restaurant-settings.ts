import type {
  DeliveryZone,
  RestaurantSettings,
  ScheduleDay,
  SpecialScheduleDay,
} from "@/lib/types";

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
  specialSchedule: [],
  ordersPaused: false,
  ordersPausedUntil: null,
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
  specialSchedule: [],
  ordersPaused: false,
  ordersPausedUntil: null,
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
  const special = findSpecialDay(settings.specialSchedule, date);
  if (special?.closed) {
    return {
      open: false,
      label: special.label ? `Închis azi · ${special.label}` : "Închis azi",
      openingTime: special.openingTime,
      closingTime: special.closingTime,
    };
  }
  const daySettings: ScheduleDay = special
    ? {
        day: currentDay,
        enabled: true,
        openingTime: special.openingTime,
        closingTime: special.closingTime,
      }
    : settings.schedule.find((item) => item.day === currentDay) ??
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

/** Data locală în format YYYY-MM-DD (nu UTC, ca să nu sară ziua după miezul nopții). */
export function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function findSpecialDay(
  specialSchedule: SpecialScheduleDay[] | undefined,
  date: Date,
) {
  if (!specialSchedule?.length) return undefined;
  const key = localDateKey(date);
  return specialSchedule.find((item) => item.date === key);
}

export function normalizeSpecialSchedule(value: unknown): SpecialScheduleDay[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Partial<SpecialScheduleDay> =>
        Boolean(item) && typeof item === "object",
    )
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(String(item.date ?? "")))
    .map((item) => ({
      date: String(item.date),
      closed: item.closed !== false,
      openingTime: isTime(item.openingTime) ? item.openingTime : "10:00",
      closingTime: isTime(item.closingTime) ? item.closingTime : "22:00",
      label: String(item.label ?? "").slice(0, 80),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Pauza este activă dacă e pornită și nu a expirat (fără dată = până la reactivare). */
export function isOrdersPaused(
  settings: Pick<RestaurantSettings, "ordersPaused" | "ordersPausedUntil">,
  date = new Date(),
) {
  if (!settings.ordersPaused) return false;
  if (!settings.ordersPausedUntil) return true;
  const until = new Date(settings.ordersPausedUntil).getTime();
  return Number.isFinite(until) && until > date.getTime();
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
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
