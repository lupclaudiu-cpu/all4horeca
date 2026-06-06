import { getSupabaseClient } from "@/lib/supabase/client";
import type { AdminRestaurant, RestaurantOnboardingInput } from "@/lib/types";

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color?: string;
  is_active: boolean;
  created_at: string;
};

export async function getAdminRestaurants(): Promise<AdminRestaurant[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");

  const [restaurantsResult, ordersResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, primary_color, secondary_color, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("restaurant_id"),
  ]);

  if (restaurantsResult.error) {
    throw new Error(restaurantsResult.error.message);
  }
  if (ordersResult.error) throw new Error(ordersResult.error.message);

  const counts = new Map<string, number>();
  (ordersResult.data ?? []).forEach((order) => {
    counts.set(
      order.restaurant_id,
      (counts.get(order.restaurant_id) ?? 0) + 1,
    );
  });

  return ((restaurantsResult.data ?? []) as RestaurantRow[]).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    logoUrl: item.logo_url,
    primaryColor: item.primary_color,
    secondaryColor: item.secondary_color,
    isActive: item.is_active,
    createdAt: item.created_at,
    orderCount: counts.get(item.id) ?? 0,
  }));
}

export async function createRestaurant(input: {
  name: string;
  slug: string;
  primaryColor: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const { error } = await supabase.from("restaurants").insert({
    name: input.name,
    slug: input.slug,
    primary_color: input.primaryColor,
    is_active: true,
  });
  if (error) throw new Error(error.message);
}

export async function createRestaurantWithOwner(
  input: RestaurantOnboardingInput,
) {
  const response = await fetch("/api/admin/restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    restaurantId?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Restaurantul nu a putut fi creat.");
  }
  return payload.restaurantId!;
}

export async function uploadRestaurantAsset(file: File) {
  validateImage(file);
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `onboarding/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("restaurant-assets")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return supabase.storage.from("restaurant-assets").getPublicUrl(path).data
    .publicUrl;
}

export async function updateRestaurantActive(
  restaurantId: string,
  isActive: boolean,
) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const { error } = await supabase
    .from("restaurants")
    .update({ is_active: isActive })
    .eq("id", restaurantId);
  if (error) throw new Error(error.message);
}

function validateImage(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Imaginea trebuie să fie JPG, PNG sau WEBP.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Imaginea poate avea maximum 5 MB.");
  }
}
