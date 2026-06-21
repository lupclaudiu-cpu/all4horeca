"use client";

import type { Order } from "@/lib/types";

const CUSTOMER_ORDERS_KEY = "antoria-customer-orders";

export function getCachedCustomerOrders(restaurantId?: string | null) {
  if (typeof window === "undefined") return [];
  const orders = readCachedOrders();
  return restaurantId ?
      orders.filter((order) => order.restaurantId === restaurantId)
    : orders;
}

export function saveCachedCustomerOrder(order: Order) {
  if (typeof window === "undefined") return;
  const orders = readCachedOrders();
  const nextOrders = [
    order,
    ...orders.filter((item) => item.id !== order.id),
  ].slice(0, 50);
  window.localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(nextOrders));
}

function readCachedOrders() {
  try {
    const value = window.localStorage.getItem(CUSTOMER_ORDERS_KEY);
    if (!value) return [];
    const orders = JSON.parse(value) as Order[];
    return Array.isArray(orders) ? orders : [];
  } catch {
    window.localStorage.removeItem(CUSTOMER_ORDERS_KEY);
    return [];
  }
}
