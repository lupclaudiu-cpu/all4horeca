import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  AdminRestaurant,
  AdminRestaurantDetails,
  RestaurantOnboardingInput,
  RestaurantOnboardingResult,
} from "@/lib/types";

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color?: string;
  is_active: boolean;
  created_at: string;
  company_name?: string;
  vat_cui?: string;
  city?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status?: "trial" | "active" | "suspended" | "deleted";
  trial_active?: boolean;
  trial_started_at?: string | null;
  trial_expires_at?: string | null;
  contract_signed?: boolean;
};

export async function getAdminRestaurants(): Promise<AdminRestaurant[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");

  const [restaurantsResult, ordersResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, primary_color, secondary_color, is_active, created_at, company_name, vat_cui, city, contact_name, contact_phone, contact_email, status, trial_active, trial_started_at, trial_expires_at, contract_signed")
      .neq("status", "deleted")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("restaurant_id, total, status"),
  ]);

  if (restaurantsResult.error) {
    throw new Error(restaurantsResult.error.message);
  }
  if (ordersResult.error) throw new Error(ordersResult.error.message);

  const counts = new Map<string, number>();
  const revenue = new Map<string, number>();
  (ordersResult.data ?? []).forEach((order) => {
    counts.set(
      order.restaurant_id,
      (counts.get(order.restaurant_id) ?? 0) + 1,
    );
    if (order.status !== "Anulată") {
      revenue.set(
        order.restaurant_id,
        (revenue.get(order.restaurant_id) ?? 0) + Number(order.total ?? 0),
      );
    }
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
    totalRevenue: revenue.get(item.id) ?? 0,
    companyName: item.company_name,
    vatCui: item.vat_cui,
    city: item.city,
    contactName: item.contact_name,
    contactPhone: item.contact_phone,
    contactEmail: item.contact_email,
    status: item.status,
    trialActive: item.trial_active,
    trialStartedAt: item.trial_started_at,
    trialExpiresAt: item.trial_expires_at,
    contractSigned: item.contract_signed,
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
    slug?: string;
    clientUrl?: string;
    dashboardUrl?: string;
    qrUrl?: string;
    ownerRequiresEmailConfirmation?: boolean;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Restaurantul nu a putut fi creat.");
  }
  return payload as RestaurantOnboardingResult;
}

export async function getAdminRestaurantDetails(
  restaurantId: string,
): Promise<AdminRestaurantDetails> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");

  const [restaurantResult, categoriesResult, productsResult, ordersResult, usersResult, qrResult] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, primary_color, secondary_color, address, phone, email, is_active, created_at")
        .eq("id", restaurantId)
        .single(),
      supabase
        .from("categories")
        .select("id, name, active, sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order"),
      supabase
        .from("products")
        .select("id, name, price, active, sold_out, categories(name)")
        .eq("restaurant_id", restaurantId)
        .order("sort_order"),
      supabase
        .from("orders")
        .select("id, order_number, total, status, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at"),
      supabase
        .from("restaurant_qr_codes")
        .select("public_url")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
    ]);

  const failure = [
    restaurantResult,
    categoriesResult,
    productsResult,
    ordersResult,
    usersResult,
    qrResult,
  ].find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);

  const item = restaurantResult.data;
  if (!item) throw new Error("Restaurantul nu exista.");
  const clientUrl = qrResult.data?.public_url || `/clienti/${item.slug}`;
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    logoUrl: item.logo_url,
    primaryColor: item.primary_color,
    secondaryColor: item.secondary_color,
    address: item.address,
    phone: item.phone,
    email: item.email,
    isActive: item.is_active,
    createdAt: item.created_at,
    orderCount: ordersResult.data?.length ?? 0,
    clientUrl,
    dashboardUrl: `/restaurant/${item.slug}`,
    qrUrl: clientUrl,
    categories: (categoriesResult.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      active: category.active,
      sortOrder: category.sort_order,
    })),
    products: (productsResult.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      categoryName:
        (product.categories as { name?: string } | null)?.name || "Fara categorie",
      price: Number(product.price),
      active: product.active,
      soldOut: product.sold_out,
    })),
    orders: (ordersResult.data ?? []).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      total: Number(order.total),
      status: order.status,
      createdAt: order.created_at,
    })),
    users: (usersResult.data ?? []).map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
    })),
  };
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

export async function updateRestaurantCommercialStatus(
  restaurantId: string,
  action: "activate" | "suspend" | "extend_trial" | "convert_paid",
) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const payload =
    action === "activate" ?
       { is_active: true, status: "trial", trial_active: true }
      : action === "suspend" ?
        { is_active: false, status: "suspended", trial_active: false }
        : action === "extend_trial"
          ? {
              is_active: true,
              status: "trial",
              trial_active: true,
              trial_expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : {
              is_active: true,
              status: "active",
              trial_active: false,
              contract_signed: true,
            };
  const { error } = await supabase
    .from("restaurants")
    .update(payload)
    .eq("id", restaurantId);
  if (error) throw new Error(error.message);
}

export async function softDeleteRestaurant(restaurantId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const { error } = await supabase.rpc("soft_delete_restaurant", {
    target_restaurant_id: restaurantId,
  });
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
