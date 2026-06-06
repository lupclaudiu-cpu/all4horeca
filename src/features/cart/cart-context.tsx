"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  CartItem,
  Product,
  SelectedProductOption,
} from "@/lib/types";

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
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "all4horeca-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
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
              unitPrice: item.unitPrice ?? item.product.price,
              lineId:
                item.lineId ??
                createLineId(item.product.id, item.selectedOptions ?? []),
            })),
          );
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((
    product: Product,
    quantity = 1,
    selectedOptions: SelectedProductOption[] = [],
  ) => {
    const lineId = createLineId(product.id, selectedOptions);
    const unitPrice =
      product.price +
      selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
    setItems((current) => {
      const existing = current.find((item) => item.lineId === lineId);
      if (existing) {
        return current.map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...current,
        { lineId, product, quantity, selectedOptions, unitPrice },
      ];
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.lineId !== lineId)
        : current.map((item) =>
            item.lineId === lineId ? { ...item, quantity } : item,
          ),
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      isOpen,
      addItem,
      updateQuantity,
      clearCart: () => setItems([]),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [items, isOpen, addItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function createLineId(
  productId: string,
  options: SelectedProductOption[],
) {
  const optionKey = options
    .map((option) => option.optionId)
    .sort()
    .join(".");
  return `${productId}:${optionKey || "base"}`;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
