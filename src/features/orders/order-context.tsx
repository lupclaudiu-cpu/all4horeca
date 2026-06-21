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
import {
  getCachedCustomerOrders,
  saveCachedCustomerOrder,
} from "@/features/orders/customer-order-cache";
import { useAuth } from "@/features/auth/auth-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { playOrderNotificationSound } from "@/features/orders/notification-sound";
import { subscribeToOrders } from "@/services/supabase-service";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";

export type NewOrderNotification = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
};

export type OrderStatusNotification = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
};

type OrderContextValue = {
  orders: Order[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    estimatedMinutes?: number,
  ) => Promise<void>;
  refreshOrders: () => Promise<void>;
  newOrderNotification: NewOrderNotification | null;
  dismissNewOrderNotification: () => void;
  orderStatusNotification: OrderStatusNotification | null;
  dismissOrderStatusNotification: () => void;
  realtimeConnected: boolean;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const userEmail = user?.email;
  const profileRole = profile?.role;
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const { settings } = useRestaurantSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOrderNotification, setNewOrderNotification] =
    useState<NewOrderNotification | null>(null);
  const [orderStatusNotification, setOrderStatusNotification] =
    useState<OrderStatusNotification | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [loadedRestaurantId, setLoadedRestaurantId] = useState<string | null>(
    null,
  );

  const refreshOrders = useCallback(async () => {
    const canReadRemoteOrders = Boolean(userId && profileRole);
    if (!restaurantId) {
      const cachedOrders = getCachedCustomerOrders(null);
      setOrders(cachedOrders);
      setLoadedRestaurantId(null);
      setError(null);
      setHydrated(!restaurantLoading);
      setLoading(restaurantLoading);
      publishDataFlowDebug({
        provider: "OrderContext",
        loading: restaurantLoading,
        restaurantId: null,
        ordersCount: cachedOrders.length,
        user: userEmail ?? userId ?? null,
        authStatus: profileRole ?? "anonymous",
        error: null,
        query: "orders:local-no-restaurant",
      });
      return;
    }
    if (!canReadRemoteOrders) {
      const cachedOrders = mergeOrderLocations(
        getCachedCustomerOrders(restaurantId),
      );
      setOrders(cachedOrders);
      setLoadedRestaurantId(restaurantId);
      setError(null);
      setHydrated(true);
      setLoading(false);
      publishDataFlowDebug({
        provider: "OrderContext",
        loading: false,
        restaurantId,
        ordersCount: cachedOrders.length,
        user: null,
        authStatus: "anonymous-local-cache",
        error: null,
        query: "orders:local-cache",
      });
      return;
    }
    setLoading(true);
    setError(null);
    publishDataFlowDebug({
      provider: "OrderContext",
      loading: true,
      restaurantId,
      ordersCount: 0,
      user: userEmail ?? userId ?? null,
      authStatus: profileRole ?? "anonymous",
      error: null,
      query: "orders:start",
    });
    try {
      const remoteOrders = mergeOrderLocations(
        await supabaseOrderRepository.list(restaurantId),
      );
      setOrders(remoteOrders);
      setLoadedRestaurantId(restaurantId);
      publishDataFlowDebug({
        provider: "OrderContext",
        loading: false,
        restaurantId,
        ordersCount: remoteOrders.length,
        user: userEmail ?? userId ?? null,
        authStatus: profileRole ?? "anonymous",
        error: null,
        query: "orders:success",
      });
    } catch (reason) {
      console.warn("[ANTORIA data-flow] Order load failed.", {
        restaurantId,
        profileRole,
        reason,
      });
      setError(
        reason instanceof Error ?
           reason.message
          : "Comenzile nu au putut fi încărcate.",
      );
      publishDataFlowDebug({
        provider: "OrderContext",
        loading: false,
        restaurantId,
        ordersCount: 0,
        user: userEmail ?? userId ?? null,
        authStatus: profileRole ?? "anonymous",
        error: reason instanceof Error ? reason.message : "Orders load failed.",
        query: "orders:error",
      });
    } finally {
      setHydrated(true);
      setLoading(false);
    }
  }, [profileRole, restaurantId, restaurantLoading, userEmail, userId]);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "OrderContext",
      loading,
      restaurantId: loadedRestaurantId,
      ordersCount: orders.length,
      user: userEmail ?? userId ?? null,
      authStatus: profileRole ?? "anonymous",
      error,
    });
  }, [error, loadedRestaurantId, loading, orders.length, profileRole, userEmail, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshOrders(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshOrders, userId]);

  useEffect(() => {
    const canMonitor = Boolean(userId && profileRole);
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

        if (
          profileRole !== "restaurant_owner" &&
          profileRole !== "super_admin"
        ) {
          return;
        }

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
      onOrderUpdated: (updatedOrder) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order,
          ),
        );
        if (profileRole === "customer") {
          setOrderStatusNotification({
            id: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
          });
        }
      },
    });
  }, [
    restaurantId,
    profileRole,
    settings.notificationsEnabled,
    settings.soundEnabled,
    userId,
  ]);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    setError(null);
    if (currentRestaurant?.accessLocked) {
      const message =
        "Perioada gratuita a expirat. Contacteaza ANTORIA pentru activarea contului.";
      setError(message);
      throw new Error(message);
    }
    try {
      const order = await supabaseOrderRepository.create(input);
      saveOrderLocation(order.id, input.customer.deliveryLocation);
      if (!userId || profileRole === "customer") {
        saveCachedCustomerOrder(order);
      }
      setOrders((current) => [order, ...current]);
      return order;
    } catch (reason) {
      const message =
        reason instanceof Error ?
           reason.message
          : "Comanda nu a putut fi trimisă.";
      setError(message);
      throw new Error(message);
    }
  }, [currentRestaurant?.accessLocked, profileRole, userId]);

  const dismissNewOrderNotification = useCallback(() => {
    setNewOrderNotification(null);
  }, []);

  const dismissOrderStatusNotification = useCallback(() => {
    setOrderStatusNotification(null);
  }, []);

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      estimatedMinutes?: number,
    ) => {
      const previous = orders;
      setError(null);
      try {
        const updatedOrder = await supabaseOrderRepository.updateStatus(
          orderId,
          status,
          estimatedMinutes,
        );
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? updatedOrder : order,
          ),
        );
      } catch (reason) {
        setOrders(previous);
        const message =
          reason instanceof Error ?
             reason.message
            : "Statusul nu a putut fi actualizat.";
        setError(message);
        throw new Error(message);
      }
    },
    [orders],
  );

  const value = useMemo(
    () => {
      const ordersMatch = restaurantId ?
         loadedRestaurantId === restaurantId
        : loadedRestaurantId === null;
      return {
        orders: ordersMatch ? orders : [],
        hydrated: hydrated && ordersMatch,
        loading: loading || !ordersMatch,
        error,
        createOrder,
        updateOrderStatus,
        refreshOrders,
        newOrderNotification,
        dismissNewOrderNotification,
        orderStatusNotification,
        dismissOrderStatusNotification,
        realtimeConnected: Boolean(restaurantId && realtimeConnected),
      };
    },
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
      orderStatusNotification,
      dismissOrderStatusNotification,
      realtimeConnected,
      restaurantId,
      loadedRestaurantId,
    ],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used inside OrderProvider");
  return context;
}
