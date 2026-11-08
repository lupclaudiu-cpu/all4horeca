"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/types";

export type OrderDiscount = { name: string | null; amount: number };

const NONE: OrderDiscount = { name: null, amount: 0 };

/** Asks the server which promotion applies to this cart (same calculation used when the order is placed). */
export function useOrderDiscount(
  restaurantId: string | null | undefined,
  items: CartItem[],
): OrderDiscount {
  const [discount, setDiscount] = useState<OrderDiscount>(NONE);
  const key = JSON.stringify(
    items.map((item) => [
      item.product.id,
      item.quantity,
      item.selectedOptions.map((o) => [o.optionId, o.quantity]),
    ]),
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !restaurantId || items.length === 0) {
      setDiscount(NONE);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void supabase
        .rpc("preview_order_discount", {
          p_restaurant_id: restaurantId,
          p_items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            options: item.selectedOptions.map((option) => ({
              option_id: option.optionId,
              quantity: option.quantity,
            })),
          })),
        })
        .then(({ data, error }) => {
          if (!active) return;
          const row = Array.isArray(data) ? data[0] : null;
          setDiscount(
            error || !row ?
              NONE
            : { name: row.promotion_name, amount: Number(row.discount) },
          );
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, key]);

  return discount;
}
