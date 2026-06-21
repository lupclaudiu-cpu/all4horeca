import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendWebPush } from "@/lib/web-push";

export const runtime = "nodejs";

type BroadcastInput = {
  restaurantId: string;
  title: string;
  body: string;
  url?: string;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Configurarea Supabase este incompletă." },
      { status: 500 },
    );
  }
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll() {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    !["restaurant_owner", "super_admin"].includes(profile.role)
  ) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }
  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY
  ) {
    return NextResponse.json(
      { error: "Cheile VAPID nu sunt configurate." },
      { status: 503 },
    );
  }

  const input = (await request.json()) as BroadcastInput;
  const restaurantId =
    profile.role === "super_admin" ? input.restaurantId : profile.restaurant_id;
  if (
    !restaurantId ||
    !input.title?.trim() ||
    !input.body?.trim() ||
    input.title.length > 80 ||
    input.body.length > 240
  ) {
    return NextResponse.json(
      { error: "Mesajul notificării este invalid." },
      { status: 400 },
    );
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_secret")
    .eq("restaurant_id", restaurantId)
    .eq("active", true);
  if (subscriptionsError) {
    return NextResponse.json(
      { error: subscriptionsError.message },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    (subscriptions ?? []).map((subscription) =>
      sendWebPush(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth_secret,
        },
        {
          title: input.title.trim(),
          body: input.body.trim(),
          url: input.url?.trim() || "/",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        },
      ).catch(() => ({ ok: false, status: 0, expired: false })),
    ),
  );
  const deliveredCount = results.filter((result) => result.ok).length;
  const failedCount = results.length - deliveredCount;

  const { error: campaignError } = await supabase
    .from("notification_campaigns")
    .insert({
      restaurant_id: restaurantId,
      actor_id: user.id,
      title: input.title.trim(),
      body: input.body.trim(),
      target_url: input.url?.trim() || "/",
      delivered_count: deliveredCount,
      failed_count: failedCount,
    });
  if (campaignError) {
    return NextResponse.json(
      { error: campaignError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    deliveredCount,
    failedCount,
    subscriptionCount: results.length,
  });
}
