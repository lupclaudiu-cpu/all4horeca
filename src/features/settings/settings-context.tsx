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
  isRestaurantOpen,
  restaurantSettings,
} from "@/features/settings/restaurant-settings";
import type { RestaurantSettings } from "@/lib/types";
import { useAuth } from "@/features/auth/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

type SettingsContextValue = {
  settings: RestaurantSettings;
  hydrated: boolean;
  restaurantOpen: boolean;
  updateSettings: (updates: Partial<RestaurantSettings>) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);
const STORAGE_KEY = "all4horeca-restaurant-settings";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? undefined;
  const [settings, setSettings] =
    useState<RestaurantSettings>(restaurantSettings);
  const [hydrated, setHydrated] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setSettings({ ...restaurantSettings, ...JSON.parse(saved) });
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    void supabase
      .from("restaurant_settings")
      .select(
        "opening_time, closing_time, accepts_delivery, accepts_pickup, accepts_cash, accepts_card, delivery_fee, free_delivery_threshold, notifications_enabled, sound_enabled, highlight_delayed_orders",
      )
      .eq("restaurant_id", restaurantId)
      .single()
      .then(({ data }) => {
        if (!active || !data) return;
        setSettings((current) => ({
          ...current,
          openingTime: data.opening_time.slice(0, 5),
          closingTime: data.closing_time.slice(0, 5),
          acceptsDelivery: data.accepts_delivery,
          acceptsPickup: data.accepts_pickup,
          acceptsCash: data.accepts_cash,
          acceptsCard: data.accepts_card,
          deliveryFee: Number(data.delivery_fee),
          freeDeliveryThreshold: Number(data.free_delivery_threshold),
          notificationsEnabled: data.notifications_enabled,
          soundEnabled: data.sound_enabled,
          highlightDelayedOrders: data.highlight_delayed_orders,
        }));
      });
    return () => {
      active = false;
    };
  }, [restaurantId]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [hydrated, settings]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<RestaurantSettings>) => {
      setSettings((current) => ({ ...current, ...updates }));
      if (restaurantId) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const payload: Record<string, string | number | boolean> = {};
          if (updates.openingTime !== undefined) payload.opening_time = updates.openingTime;
          if (updates.closingTime !== undefined) payload.closing_time = updates.closingTime;
          if (updates.acceptsDelivery !== undefined) payload.accepts_delivery = updates.acceptsDelivery;
          if (updates.acceptsPickup !== undefined) payload.accepts_pickup = updates.acceptsPickup;
          if (updates.acceptsCash !== undefined) payload.accepts_cash = updates.acceptsCash;
          if (updates.acceptsCard !== undefined) payload.accepts_card = updates.acceptsCard;
          if (updates.deliveryFee !== undefined) payload.delivery_fee = updates.deliveryFee;
          if (updates.freeDeliveryThreshold !== undefined) payload.free_delivery_threshold = updates.freeDeliveryThreshold;
          if (updates.notificationsEnabled !== undefined) payload.notifications_enabled = updates.notificationsEnabled;
          if (updates.soundEnabled !== undefined) payload.sound_enabled = updates.soundEnabled;
          if (updates.highlightDelayedOrders !== undefined) payload.highlight_delayed_orders = updates.highlightDelayedOrders;
          void supabase
            .from("restaurant_settings")
            .update(payload)
            .eq("restaurant_id", restaurantId);
        }
      }
    },
    [restaurantId],
  );

  const resetSettings = useCallback(() => {
    setSettings(restaurantSettings);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      hydrated,
      restaurantOpen: isRestaurantOpen(settings, new Date(clock)),
      updateSettings,
      resetSettings,
    }),
    [settings, hydrated, clock, updateSettings, resetSettings],
  );

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
