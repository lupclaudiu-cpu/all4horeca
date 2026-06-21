"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  CartItem,
  Product,
  SelectedProductOption,
} from "@/lib/types";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { calculateCartTotal } from "@/lib/cart-pricing";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  addItem: (
    product: Product,
    quantity?: number,
    selectedOptions?: SelectedProductOption[],
  ) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "all4horeca-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const [items, setItems] = useState<CartItem[]>([]);
  const activeRestaurantId = restaurantId ?? items[0]?.product.restaurantId;
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "CartProvider",
      providerMounted: true,
      lastStep: "CartProvider mounted",
    });
  }, []);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "CartProvider",
      providerMounted: true,
      loading: !hydrated,
      restaurantId: activeRestaurantId ?? null,
      productsCount: items.length,
      lastStep: isOpen ? "Cart open" : "Cart closed",
    });
  }, [activeRestaurantId, hydrated, isOpen, items.length]);

  useEffect(() => {
    if (restaurantLoading || !restaurantId) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHydrated(false);
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Array<
            Partial<CartItem> & { product: Product; quantity: number }
          >;
          setItems(
            parsed.map((item) => ({
              product: item.product,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions ?? [],
              unitPrice: item.product.price,
              lineId:
                item.lineId ??
                createLineId(item.product.id, item.selectedOptions ?? []),
            })).map((item) => ({
              ...item,
              selectedOptions: item.selectedOptions.map((option) => ({
                ...option,
                quantity: option.quantity ?? 1,
                multiplyByProductQuantity:
                  option.multiplyByProductQuantity ?? false,
              })),
            })).filter((item) => item.product.restaurantId === restaurantId),
          );
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [restaurantId, restaurantLoading]);

  useEffect(() => {
    if (hydrated && restaurantId) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [hydrated, items, restaurantId]);

  const addItem = useCallback((
    product: Product,
    quantity = 1,
    selectedOptions: SelectedProductOption[] = [],
  ) => {
    const lineId = createLineId(product.id, selectedOptions);
    const unitPrice = product.price;
    setItems((current) => {
      const restaurantItems = current.filter(
        (item) => item.product.restaurantId === product.restaurantId,
      );
      const existing = restaurantItems.find((item) => item.lineId === lineId);
      if (existing) {
        return restaurantItems.map((item) =>
          item.lineId === lineId ?
             { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...restaurantItems,
        { lineId, product, quantity, selectedOptions, unitPrice },
      ];
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0 ?
         current.filter((item) => item.lineId !== lineId)
        : current.map((item) =>
            item.lineId === lineId ? { ...item, quantity } : item,
          ),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const value = useMemo(
    () => {
      const restaurantItems = items.filter(
        (item) => item.product.restaurantId === activeRestaurantId,
      );
      return {
        items: restaurantItems,
        itemCount: restaurantItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
        total: calculateCartTotal(restaurantItems),
        isOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart: () => setItems([]),
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      };
    },
    [items, activeRestaurantId, isOpen, addItem, updateQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function createLineId(
  productId: string,
  options: SelectedProductOption[],
) {
  const optionKey = options
    .map((option) =>
      [
        option.optionId,
        option.quantity ?? 1,
        option.multiplyByProductQuantity ? "scaled" : "fixed",
      ].join("-"),
    )
    .sort()
    .join(".");
  return `${productId}:${optionKey || "base"}`;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
