import { getSupabaseClient } from "@/lib/supabase/client";

export type PushPermissionState =
  | "unsupported"
  | "default"
  | "denied"
  | "granted";

export function getPushPermission(): PushPermissionState {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function subscribeToRestaurantPush(restaurantId: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("Cheia publică VAPID nu este configurată.");
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Autentifică-te pentru a activa notificările.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permisiunea pentru notificări nu a fost acordată.");
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: fromBase64Url(publicKey),
    }));
  const json = subscription.toJSON();
  if (!json.keys?.p256dh || !json.keys.auth) {
    throw new Error("Abonamentul push nu conține cheile necesare.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      restaurant_id: restaurantId,
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: json.keys.p256dh,
      auth_secret: json.keys.auth,
      user_agent: navigator.userAgent,
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "restaurant_id,endpoint" },
  );
  if (error) throw new Error(error.message);
  window.localStorage.setItem(`antoria-push:${restaurantId}`, "enabled");
}

export async function unsubscribeFromRestaurantPush(restaurantId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("restaurant_id", restaurantId)
      .eq("endpoint", subscription.endpoint);
    await subscription.unsubscribe();
  }
  window.localStorage.removeItem(`antoria-push:${restaurantId}`);
}

export async function isPushSubscribed(restaurantId: string) {
  if (getPushPermission() !== "granted") return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("endpoint", subscription.endpoint)
    .eq("active", true);
  return Boolean(count);
}

function fromBase64Url(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
