"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DashboardIcon,
  HistoryIcon,
  LogoutIcon,
  OrdersIcon,
  ProductsIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons";
import { restaurant } from "@/data/restaurant";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { useAuth } from "@/features/auth/auth-context";
import { useRouter } from "next/navigation";
import { useOrders } from "@/features/orders/order-context";
import { NewOrderToast } from "@/features/dashboard/new-order-toast";
import {
  getRestaurantPresence,
  type RestaurantPresence,
} from "@/services/commercial-service";

const navigation = [
  { href: "/restaurant/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/restaurant/dashboard/comenzi", label: "Comenzi live", icon: OrdersIcon },
  { href: "/restaurant/dashboard/istoric", label: "Istoric", icon: HistoryIcon },
  { href: "/restaurant/dashboard/clienti", label: "Clienți", icon: UserIcon },
  { href: "/restaurant/dashboard/categorii", label: "Categorii", icon: ProductsIcon },
  { href: "/restaurant/dashboard/produse", label: "Produse", icon: ProductsIcon },
  { href: "/restaurant/dashboard/prezenta", label: "QR & SEO", icon: SettingsIcon },
  { href: "/restaurant/dashboard/setari", label: "Setări", icon: SettingsIcon },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, restaurantOpen } = useRestaurantSettings();
  const { profile, signOut } = useAuth();
  const [presence, setPresence] = useState<RestaurantPresence | null>(null);
  const { orders, realtimeConnected } = useOrders();
  const newOrdersCount = orders.filter((order) => order.status === "Nouă").length;

  useEffect(() => {
    if (!profile?.restaurantId) return;
    void getRestaurantPresence(profile.restaurantId).then(setPresence);
  }, [profile?.restaurantId]);

  const restaurantName = presence?.name || restaurant.name;
  const restaurantInitials = restaurantName.slice(0, 2).toUpperCase();

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f4f2] text-[#171411] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden min-h-screen border-r border-black/5 bg-[#171411] p-5 text-white lg:sticky lg:top-0 lg:block lg:h-screen">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#ff5a1f] text-sm font-black">
            {restaurantInitials}
          </div>
          <div>
            <p className="text-sm font-black">{restaurantName}</p>
            <p className="mt-1 text-[11px] text-white/50">Restaurant dashboard</p>
          </div>
        </div>
        <nav className="mt-8 space-y-2">
          {navigation.map((item) => {
            const active =
              item.href === "/restaurant/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-[#ff5a1f] text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-5" />
                {item.label}
                {item.href.endsWith("/comenzi") && newOrdersCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                    {newOrdersCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => void logout()}
          className="absolute bottom-6 left-5 right-5 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <LogoutIcon className="size-5" />
          Ieșire din cont
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#171411] text-xs font-black text-white lg:hidden">
              {restaurantInitials}
            </div>
            <div>
              <p className="text-sm font-black">{restaurantName}</p>
              <p className="text-[11px] text-[#8b8580]">
                <span className={`mr-1 inline-block size-2 rounded-full ${restaurantOpen ? "bg-emerald-500" : "bg-red-500"}`} />
                Restaurant {restaurantOpen ? "deschis" : "închis"} · {settings.openingTime}-{settings.closingTime}
              </p>
              <p className="mt-0.5 text-[10px] text-[#aaa39d]">
                {profile?.fullName || profile?.email}
                <span
                  className={`ml-2 inline-block size-1.5 rounded-full ${
                    realtimeConnected ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                  title={realtimeConnected ? "Realtime conectat" : "Realtime deconectat"}
                />
              </p>
            </div>
          </div>
          <Link
            href={presence?.publicUrl || "/"}
            className="rounded-xl bg-[#f3f0ed] px-3 py-2 text-xs font-black text-[#5e5852]"
          >
            Aplicație
          </Link>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-black/5 bg-white/95 px-1 pt-2 backdrop-blur-xl lg:hidden">
          {navigation.map((item) => {
            const active =
              item.href === "/restaurant/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[76px] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold ${
                  active ? "text-[#ff5a1f]" : "text-[#8b8580]"
                }`}
              >
                <Icon className="size-5" />
                <span className="relative truncate">
                  {item.label.replace("Comenzi ", "")}
                  {item.href.endsWith("/comenzi") && newOrdersCount > 0 && (
                    <span className="absolute -right-3 -top-2 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[8px] font-black text-white">
                      {newOrdersCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
        <NewOrderToast />
      </div>
    </div>
  );
}
