"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultSchedule,
  getRestaurantScheduleStatus,
  isOrdersPaused,
  isRestaurantOpen,
  normalizeSpecialSchedule,
  restaurantSettings,
  unavailableRestaurantSettings,
} from "@/features/settings/restaurant-settings";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DeliveryZone, RestaurantSettings, ScheduleDay } from "@/lib/types";

type SettingsContextValue = {
  settings: RestaurantSettings;
  hydrated: boolean;
  loadingError: string | null;
  restaurantOpen: boolean;
  restaurantStatus: ReturnType<typeof getRestaurantScheduleStatus>;
  /** Comenzile noi sunt oprite temporar de administrator. */
  ordersPaused: boolean;
  /** Ultima salvare a setărilor (pentru lista de configurare). */
  settingsUpdatedAt: string | null;
  /** false dacă migrarea 20261111000100 nu a fost încă aplicată. */
  extendedSettingsAvailable: boolean;
  setOrdersPause: (minutes: number | "manual" | null) => Promise<void>;
  updateSettings: (updates: Partial<RestaurantSettings>) => void;
  saveSettings: () => Promise<RestaurantSettings>;
  resetSettings: () => Promise<RestaurantSettings>;
};

type SettingsRow = {
  opening_time: string;
  closing_time: string;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_cash: boolean;
  accepts_card: boolean;
  delivery_fee: number | string;
  free_delivery_threshold: number | string;
  minimum_order_value?: number | string;
  estimated_delivery_time?: string;
  block_orders_outside_schedule?: boolean;
  weekly_schedule?: unknown;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  highlight_delayed_orders: boolean;
  updated_at?: string | null;
  special_schedule?: unknown;
  orders_paused?: boolean;
  orders_paused_until?: string | null;
};

const SETTINGS_COLUMNS =
  "opening_time, closing_time, accepts_delivery, accepts_pickup, accepts_cash, accepts_card, delivery_fee, free_delivery_threshold, minimum_order_value, estimated_delivery_time, block_orders_outside_schedule, weekly_schedule, notifications_enabled, sound_enabled, highlight_delayed_orders, updated_at";
// Coloane adăugate de migrarea 20261111000100. Dacă lipsesc, aplicația funcționează ca înainte.
const EXTENDED_SETTINGS_COLUMNS = `${SETTINGS_COLUMNS}, special_schedule, orders_paused, orders_paused_until`;

type DeliveryZoneRow = {
  id: string;
  restaurant_id: string;
  name: string;
  areas: string[];
  delivery_fee: number | string;
  active: boolean;
  sort_order: number;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const [settings, setSettings] =
    useState<RestaurantSettings>(unavailableRestaurantSettings);
  const [hydrated, setHydrated] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [clock, setClock] = useState(0);
  const [loadedRestaurantId, setLoadedRestaurantId] = useState<string | null>(
    null,
  );
  const [extendedSettingsAvailable, setExtendedSettingsAvailable] =
    useState(true);
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!restaurantId) {
      const timer = window.setTimeout(() => {
        setLoadingError(null);
        setSettings(unavailableRestaurantSettings);
        setLoadedRestaurantId(null);
        setHydrated(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = window.setTimeout(() => {
        setSettings(unavailableRestaurantSettings);
        setLoadedRestaurantId(null);
        setLoadingError("Supabase nu este configurat.");
        setHydrated(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    const loadingTimer = window.setTimeout(() => {
      setLoadingError(null);
      setHydrated(false);
    }, 0);
    const loadSettingsRow = async () => {
      const extended = await supabase
        .from("restaurant_settings")
        .select(EXTENDED_SETTINGS_COLUMNS)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
      if (!extended.error) return { ...extended, extendedAvailable: true };
      const base = await supabase
        .from("restaurant_settings")
        .select(SETTINGS_COLUMNS)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
      return { ...base, extendedAvailable: false };
    };
    void Promise.all([
      loadSettingsRow(),
      supabase
        .from("delivery_zones")
        .select("id, restaurant_id, name, areas, delivery_fee, active, sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order"),
    ])
      .then(([settingsResult, zonesResult]) => {
        if (!active) return;
        const { data, error } = settingsResult;
        if (error) {
          setSettings(unavailableRestaurantSettings);
          setLoadedRestaurantId(null);
          setLoadingError(
            `Setările nu au putut fi încărcate: ${error.message}`,
          );
          setHydrated(true);
          return;
        }
        if (zonesResult.error) {
          setSettings(unavailableRestaurantSettings);
          setLoadedRestaurantId(null);
          setLoadingError(
            `Zonele de livrare nu au putut fi incarcate: ${zonesResult.error.message}`,
          );
          setHydrated(true);
          return;
        }

        const deliveryZones = (zonesResult.data ?? []).map(mapDeliveryZoneRow);
        setExtendedSettingsAvailable(settingsResult.extendedAvailable);
        setSettingsUpdatedAt(
          (data as SettingsRow | null)?.updated_at ?? null,
        );
        setSettings({
          ...(data ? mapSettingsRow(data as SettingsRow) : restaurantSettings),
          deliveryZones,
        });
        setLoadedRestaurantId(restaurantId);
        setHydrated(true);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTimer);
    };
  }, [restaurantId]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setClock(Date.now()), 0);
    const interval = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<RestaurantSettings>) => {
      setSettings((current) => ({ ...current, ...updates }));
    },
    [],
  );

  const persistSettings = useCallback(
    async (nextSettings: RestaurantSettings) => {
      if (!restaurantId) {
        throw new Error("Nu este selectat niciun restaurant.");
      }
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase nu este configurat.");

      const columns = extendedSettingsAvailable ?
         EXTENDED_SETTINGS_COLUMNS
        : SETTINGS_COLUMNS;
      const { data, error } = await supabase
        .from("restaurant_settings")
        .upsert(
          {
            ...(extendedSettingsAvailable ?
               { special_schedule: nextSettings.specialSchedule }
              : {}),
            restaurant_id: restaurantId,
            opening_time: nextSettings.openingTime,
            closing_time: nextSettings.closingTime,
            accepts_delivery: nextSettings.acceptsDelivery,
            accepts_pickup: nextSettings.acceptsPickup,
            accepts_cash: nextSettings.acceptsCash,
            accepts_card: nextSettings.acceptsCard,
            delivery_fee: nextSettings.deliveryFee,
            free_delivery_threshold: nextSettings.freeDeliveryThreshold,
            minimum_order_value: nextSettings.minimumOrderValue,
            estimated_delivery_time: nextSettings.estimatedDeliveryTime,
            block_orders_outside_schedule:
              nextSettings.blockOrdersOutsideSchedule,
            weekly_schedule: nextSettings.schedule,
            notifications_enabled: nextSettings.notificationsEnabled,
            sound_enabled: nextSettings.soundEnabled,
            highlight_delayed_orders: nextSettings.highlightDelayedOrders,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "restaurant_id" },
        )
        .select(columns)
        .single();

      if (error) {
        throw new Error(`Setările nu au putut fi salvate: ${error.message}`);
      }

      const savedRow = data as unknown as SettingsRow;
      const savedSettings = {
        ...mapSettingsRow(savedRow),
        deliveryZones: nextSettings.deliveryZones,
      };
      await syncDeliveryZones(restaurantId, nextSettings.deliveryZones);
      setSettings(savedSettings);
      setSettingsUpdatedAt(savedRow.updated_at ?? new Date().toISOString());
      setLoadedRestaurantId(restaurantId);
      setLoadingError(null);
      return savedSettings;
    },
    [restaurantId, extendedSettingsAvailable],
  );

  const setOrdersPause = useCallback(
    async (minutes: number | "manual" | null) => {
      if (!restaurantId) {
        throw new Error("Nu este selectat niciun restaurant.");
      }
      if (!extendedSettingsAvailable) {
        throw new Error(
          "Pauza comenzilor va fi disponibilă după actualizarea bazei de date.",
        );
      }
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase nu este configurat.");
      const ordersPaused = minutes !== null;
      const ordersPausedUntil =
        typeof minutes === "number" ?
           new Date(Date.now() + minutes * 60_000).toISOString()
          : null;
      const { error } = await supabase
        .from("restaurant_settings")
        .update({
          orders_paused: ordersPaused,
          orders_paused_until: ordersPausedUntil,
        })
        .eq("restaurant_id", restaurantId);
      if (error) {
        throw new Error(`Pauza nu a putut fi salvată: ${error.message}`);
      }
      setSettings((current) => ({
        ...current,
        ordersPaused,
        ordersPausedUntil,
      }));
      setClock(Date.now());
    },
    [restaurantId, extendedSettingsAvailable],
  );

  const saveSettings = useCallback(
    () => persistSettings(settings),
    [persistSettings, settings],
  );

  const resetSettings = useCallback(
    () =>
      persistSettings({
        ...restaurantSettings,
        deliveryZones: createDefaultDeliveryZones(),
      }),
    [persistSettings],
  );

  const value = useMemo(() => {
    const settingsMatch = restaurantId ?
       loadedRestaurantId === restaurantId
      : loadedRestaurantId === null;
    const resolvedSettings = settingsMatch ?
       settings
      : unavailableRestaurantSettings;

    const ordersPaused = isOrdersPaused(resolvedSettings, new Date(clock));
    return {
      settings: resolvedSettings,
      hydrated: hydrated && settingsMatch,
      loadingError,
      ordersPaused,
      settingsUpdatedAt: settingsMatch ? settingsUpdatedAt : null,
      extendedSettingsAvailable,
      setOrdersPause,
      restaurantOpen:
        Boolean(currentRestaurant && !currentRestaurant.accessLocked) &&
        !ordersPaused &&
        (!resolvedSettings.blockOrdersOutsideSchedule ||
          isRestaurantOpen(resolvedSettings, new Date(clock))),
      restaurantStatus: getRestaurantScheduleStatus(
        resolvedSettings,
        new Date(clock),
      ),
      updateSettings,
      saveSettings,
      resetSettings,
    };
  }, [
    settings,
    hydrated,
    loadingError,
    clock,
    updateSettings,
    saveSettings,
    resetSettings,
    currentRestaurant,
    loadedRestaurantId,
    restaurantId,
    settingsUpdatedAt,
    extendedSettingsAvailable,
    setOrdersPause,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useRestaurantSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useRestaurantSettings must be used inside SettingsProvider",
    );
  }
  return context;
}

function mapSettingsRow(data: SettingsRow): RestaurantSettings {
  return {
    openingTime: data.opening_time.slice(0, 5),
    closingTime: data.closing_time.slice(0, 5),
    acceptsDelivery: data.accepts_delivery,
    acceptsPickup: data.accepts_pickup,
    acceptsCash: data.accepts_cash,
    acceptsCard: data.accepts_card,
    deliveryFee: Number(data.delivery_fee),
    freeDeliveryThreshold: Number(data.free_delivery_threshold),
    minimumOrderValue: Number(data.minimum_order_value ?? 0),
    estimatedDeliveryTime: data.estimated_delivery_time ?? "30-45 min",
    blockOrdersOutsideSchedule: data.block_orders_outside_schedule ?? true,
    schedule: normalizeSchedule(data.weekly_schedule),
    specialSchedule: normalizeSpecialSchedule(data.special_schedule),
    ordersPaused: data.orders_paused ?? false,
    ordersPausedUntil: data.orders_paused_until ?? null,
    deliveryZones: [],
    notificationsEnabled: data.notifications_enabled,
    soundEnabled: data.sound_enabled,
    highlightDelayedOrders: data.highlight_delayed_orders,
  };
}

function normalizeSchedule(value: unknown): ScheduleDay[] {
  if (!Array.isArray(value)) return defaultSchedule;
  const rows = value as Partial<ScheduleDay>[];
  return defaultSchedule.map((fallback) => {
    const day = rows.find((item) => item.day === fallback.day);
    return {
      day: fallback.day,
      enabled: day?.enabled ?? fallback.enabled,
      openingTime: day?.openingTime ?? fallback.openingTime,
      closingTime: day?.closingTime ?? fallback.closingTime,
    };
  });
}

function mapDeliveryZoneRow(row: DeliveryZoneRow): DeliveryZone {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    areas: row.areas ?? [],
    deliveryFee: Number(row.delivery_fee),
    active: row.active,
    sortOrder: row.sort_order,
  };
}

async function syncDeliveryZones(
  restaurantId: string,
  zones: DeliveryZone[],
) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const zoneIds = zones.map((zone) => zone.id);
  const deleteQuery = supabase
    .from("delivery_zones")
    .delete()
    .eq("restaurant_id", restaurantId);
  const { error: deleteError } = zoneIds.length ?
     await deleteQuery.not("id", "in", `(${zoneIds.join(",")})`)
    : await deleteQuery;
  if (deleteError) throw new Error(deleteError.message);

  if (!zones.length) return;
  const { error } = await supabase.from("delivery_zones").upsert(
    zones.map((zone) => ({
      id: zone.id,
      restaurant_id: restaurantId,
      name: zone.name.trim(),
      areas: zone.areas.map((area) => area.trim()).filter(Boolean),
      delivery_fee: zone.deliveryFee,
      active: zone.active,
      sort_order: zone.sortOrder,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

function createDefaultDeliveryZones(): DeliveryZone[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Zona centrală",
      areas: ["centru", "central"],
      deliveryFee: 5,
      active: true,
      sortOrder: 0,
    },
    {
      id: crypto.randomUUID(),
      name: "Zona extinsă",
      areas: ["extins", "extended"],
      deliveryFee: 10,
      active: true,
      sortOrder: 1,
    },
    {
      id: crypto.randomUUID(),
      name: "Zona periferică",
      areas: ["periferie", "peripheral"],
      deliveryFee: 15,
      active: false,
      sortOrder: 2,
    },
  ];
}
