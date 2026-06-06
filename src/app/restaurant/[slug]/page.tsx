import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RestaurantSlugDashboardRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) redirect("/login");

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll() {},
    },
  });
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) redirect("/404");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/restaurant/${slug}`)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    (profile.role !== "super_admin" && profile.restaurant_id !== restaurant.id)
  ) {
    redirect("/403");
  }
  redirect("/restaurant/dashboard");
}
