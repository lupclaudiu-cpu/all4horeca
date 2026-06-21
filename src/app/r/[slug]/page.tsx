import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicRestaurantPage } from "@/features/public-restaurant/public-restaurant-page";
import { getPublicServerClient } from "@/lib/supabase/public-server";
import { isTrialExpired } from "@/lib/trial";
import { getPublicCatalog } from "@/services/public-catalog-service";

async function getRestaurant(slug: string) {
  const supabase = getPublicServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("restaurants")
    .select("id, slug, name, logo_url, primary_color, secondary_color, address, phone, seo_title, seo_description, social_image_url, is_active, status, trial_active, trial_started_at, trial_expires_at, contract_signed")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) return { title: "Restaurant indisponibil" };
  return {
    title: restaurant.seo_title || restaurant.name,
    description:
      restaurant.seo_description ||
      `Comandă online de la ${restaurant.name} prin ANTORIA.`,
    openGraph: restaurant.social_image_url ?
       { images: [restaurant.social_image_url] }
      : undefined,
  };
}

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category } = await searchParams;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();
  const catalog = await getPublicCatalog(restaurant.id);
  const trialExpired = isTrialExpired(
    restaurant.trial_active,
    restaurant.trial_expires_at,
  );
  const status = restaurant.status ?? "active";
  return (
    <PublicRestaurantPage
      restaurant={{
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        logoUrl: restaurant.logo_url,
        primaryColor: restaurant.primary_color,
        secondaryColor: restaurant.secondary_color,
        address: restaurant.address,
        phone: restaurant.phone,
        isActive: restaurant.is_active,
        status,
        trialActive: restaurant.trial_active ?? false,
        trialStartedAt: restaurant.trial_started_at ?? null,
        trialExpiresAt: restaurant.trial_expires_at ?? null,
        contractSigned: restaurant.contract_signed ?? false,
        trialExpired,
        accessLocked:
          status === "suspended" ||
          status === "deleted" ||
          trialExpired,
      }}
      initialCategory={category}
      initialProducts={catalog.products}
      initialCategories={catalog.categories}
      initialCatalogError={catalog.error}
    />
  );
}
