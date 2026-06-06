import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicRestaurantPage } from "@/features/public-restaurant/public-restaurant-page";
import { getPublicServerClient } from "@/lib/supabase/public-server";

async function getRestaurant(slug: string) {
  const supabase = getPublicServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, logo_url, primary_color, secondary_color, address, phone, seo_title, seo_description, social_image_url")
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
      `Comandă online de la ${restaurant.name} prin ALL4HORECA.`,
    openGraph: restaurant.social_image_url
      ? { images: [restaurant.social_image_url] }
      : undefined,
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();
  return (
    <PublicRestaurantPage
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        logoUrl: restaurant.logo_url,
        primaryColor: restaurant.primary_color,
        secondaryColor: restaurant.secondary_color,
        address: restaurant.address,
        phone: restaurant.phone,
      }}
    />
  );
}
