import { getSupabaseClient } from "@/lib/supabase/client";
import type { Promotion, PromotionType } from "@/lib/types";

type PublicPromotionRow = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  promotion_type: PromotionType;
  discount_percent: number | string;
  trigger_order_number: number | null;
  starts_at: string | null;
  ends_at: string | null;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  sort_order: number;
  promotion_products: Array<{ product_id: string }>;
};

export async function getActivePromotions(
  restaurantId: string,
): Promise<Promotion[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("promotions")
    .select(
      "id, restaurant_id, name, description, promotion_type, discount_percent, trigger_order_number, starts_at, ends_at, valid_from, valid_until, active, sort_order, promotion_products(product_id)",
    )
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);

  const now = new Date();
  const today = localDateKey(now);
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  return ((data ?? []) as unknown as PublicPromotionRow[])
    .filter((row) => {
      if (row.valid_from && row.valid_from > today) return false;
      if (row.valid_until && row.valid_until < today) return false;
      if (
        row.promotion_type === "product_discount" &&
        row.promotion_products.length === 0
      ) {
        return false;
      }
      if (
        row.promotion_type === "happy_hour" &&
        row.starts_at &&
        row.ends_at
      ) {
        const startsAt = row.starts_at.slice(0, 5);
        const endsAt = row.ends_at.slice(0, 5);
        return currentTime >= startsAt && currentTime <= endsAt;
      }
      return true;
    })
    .map((row) => ({
      id: row.id,
      restaurantId: row.restaurant_id,
      name: row.name,
      description: row.description,
      type: row.promotion_type,
      discountPercent: Number(row.discount_percent),
      triggerOrderNumber: row.trigger_order_number,
      startsAt: row.starts_at?.slice(0, 5) ?? null,
      endsAt: row.ends_at?.slice(0, 5) ?? null,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      active: row.active,
      sortOrder: row.sort_order,
      productIds: row.promotion_products.map((item) => item.product_id),
    }));
}

function localDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
