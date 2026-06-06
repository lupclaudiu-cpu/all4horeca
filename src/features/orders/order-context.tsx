"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CreateOrderInput, Order, OrderStatus } from "@/lib/types";
import { supabaseOrderRepository } from "@/features/orders/order-repository";
import {
  mergeOrderLocations,
  saveOrderLocation,
} from "@/features/orders/order-location-cache";
import { useAuth } from "@/features/auth/auth-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { playOrderNotificationSound } from "@/features/orders/notification-sound";
import { subscribeToOrders } from "@/services/supabase-service";

export type NewOrderNotification = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
};

type OrderContextValue = {
  orders: Order[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  refreshOrders: () => Promise<void>;
  newOrderNotification: NewOrderNotification | null;
  dismissNewOrderNotification: () => void;
  realtimeConnected: boolean;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? undefined;
  const { settings } = useRestaurantSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOrderNotification, setNewOrderNotification] =
    useState<NewOrderNotification | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(
        mergeOrderLocations(
          await supabaseOrderRepository.list(restaurantId),
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Comenzile nu au putut fi încărcate.",
      );
    } finally {
      setHydrated(true);
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshOrders(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshOrders, user?.id]);

  useEffect(() => {
    const canMonitor =
      profile?.role === "restaurant_owner" ||
      profile?.role === "super_admin";
    if (!restaurantId || !canMonitor) {
      return;
    }

    return subscribeToOrders({
      restaurantId,
      onConnectionChange: setRealtimeConnected,
      onNewOrder: (order) => {
        setOrders((current) => [
          order,
          ...current.filter((item) => item.id !== order.id),
        ]);

        const seenKey = `all4horeca-notified-order-${order.id}`;
        if (
          settings.notificationsEnabled &&
          !window.sessionStorage.getItem(seenKey)
        ) {
          window.sessionStorage.setItem(seenKey, "1");
          setNewOrderNotification({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer.name,
            total: order.total,
          });
          if (settings.soundEnabled) {
            void playOrderNotificationSound();
          }
        }
      },
      onStatusChange: (orderId, status) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, status } : order,
          ),
        );
      },
    });
  }, [
    restaurantId,
    profile?.role,
    settings.notificationsEnabled,
    settings.soundEnabled,
  ]);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    setError(null);
    try {
      const order = await supabaseOrderRepository.create(input);
      saveOrderLocation(order.id, input.customer.deliveryLocation);
      setOrders((current) => [order, ...current]);
      return order;
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Comanda nu a putut fi trimisă.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  const dismissNewOrderNotification = useCallback(() => {
    setNewOrderNotification(null);
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const previous = orders;
      setError(null);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
      try {
        await supabaseOrderRepository.updateStatus(orderId, status);
      } catch (reason) {
        setOrders(previous);
        const message =
          reason instanceof Error
            ? reason.message
            : "Statusul nu a putut fi actualizat.";
        setError(message);
        throw new Error(message);
      }
    },
    [orders],
  );

  const value = useMemo(
    () => ({
      orders,
      hydrated,
      loading,
      error,
      createOrder,
      updateOrderStatus,
      refreshOrders,
      newOrderNotification,
      dismissNewOrderNotification,
      realtimeConnected: Boolean(restaurantId && realtimeConnected),
    }),
    [
      orders,
      hydrated,
      loading,
      error,
      createOrder,
      updateOrderStatus,
      refreshOrders,
      newOrderNotification,
      dismissNewOrderNotification,
      realtimeConnected,
      restaurantId,
    ],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used inside OrderProvider");
  return context;
}
