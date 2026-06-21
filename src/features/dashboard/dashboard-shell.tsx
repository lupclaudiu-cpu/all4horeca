"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartIcon,
  DashboardIcon,
  HistoryIcon,
  LogoutIcon,
  OrdersIcon,
  ProductsIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { useAuth } from "@/features/auth/auth-context";
import { useRouter } from "next/navigation";
import { useOrders } from "@/features/orders/order-context";
import { NewOrderToast } from "@/features/dashboard/new-order-toast";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { AntoriaBrand } from "@/components/antoria-brand";

const navigation = [
  { href: "/restaurant/dashboard", label: "Prezentare", icon: DashboardIcon },
  { href: "/restaurant/dashboard/comenzi", label: "Comenzi live", icon: OrdersIcon },
  { href: "/restaurant/dashboard/istoric", label: "Istoric", icon: HistoryIcon },
  { href: "/restaurant/dashboard/rapoarte", label: "Rapoarte", icon: ChartIcon },
  { href: "/restaurant/dashboard/clienti", label: "Clienți", icon: UserIcon },
  { href: "/restaurant/dashboard/categorii", label: "Categorii", icon: ProductsIcon },
  { href: "/restaurant/dashboard/produse", label: "Produse", icon: ProductsIcon },
  { href: "/restaurant/dashboard/promotii", label: "Promoții", icon: ProductsIcon },
  { href: "/restaurant/dashboard/notificari", label: "Notificări", icon: OrdersIcon },
  { href: "/restaurant/dashboard/prezenta", label: "QR & SEO", icon: SettingsIcon },
  { href: "/restaurant/dashboard/setari", label: "Setări", icon: SettingsIcon },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, restaurantOpen } = useRestaurantSettings();
  const { profile, signOut } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const { orders, realtimeConnected } = useOrders();
  const newOrdersCount = orders.filter((order) => order.status === "Nouă").length;

  const restaurantName = currentRestaurant?.name || "ALL4HORECA";
  const restaurantInitials = restaurantName.slice(0, 2).toUpperCase();
  const accessLocked = currentRestaurant?.accessLocked;
  const navigationHref = (href: string) =>
    profile?.role === "super_admin" && currentRestaurant
      ? `${href}?restaurant=${currentRestaurant.id}`
      : href;

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="antoria-gradient relative hidden min-h-screen flex-col overflow-y-auto border-r border-white/5 p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="border-b border-white/10 px-2 pb-6 pt-2">
          <AntoriaBrand inverse />
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-black shadow-lg shadow-blue-950/30">
            {restaurantInitials}
          </div>
          <div>
            <p className="text-sm font-black">{restaurantName}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100/60">Panou de control</p>
          </div>
        </div>
        <nav className="mt-6 flex-1 space-y-1.5 pb-4">
          {navigation.map((item) => {
            const active =
              item.href === "/restaurant/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={navigationHref(item.href)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active ?
                     "bg-white text-slate-950 shadow-xl shadow-blue-950/20"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
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
          className="mt-3 flex shrink-0 items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <LogoutIcon className="size-5" />
          Ieșire din cont
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden"><AntoriaBrand compact /></div>
            <div>
              <p className="text-sm font-black">{restaurantName}</p>
              <p className="text-[11px] text-[#64748b]">
                <span className={`mr-1 inline-block size-2 rounded-full ${restaurantOpen ? "bg-emerald-500" : "bg-red-500"}`} />
                Restaurant {restaurantOpen ? "deschis" : "închis"} · {settings.openingTime}-{settings.closingTime}
              </p>
              <p className="mt-0.5 text-[10px] text-[#94a3b8]">
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
            href={
              currentRestaurant ? `/clienti/${currentRestaurant.slug}` : "/admin"
            }
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
          >
            Aplicație
          </Link>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          {accessLocked && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
              Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.
            </div>
          )}
          {children}
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-200/80 bg-white/90 px-1 pt-2 shadow-[0_-12px_35px_rgba(15,23,42,.06)] backdrop-blur-2xl lg:hidden">
          {navigation.map((item) => {
            const active =
              item.href === "/restaurant/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={navigationHref(item.href)}
                className={`flex min-w-[76px] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold ${
                  active ? "text-blue-600" : "text-slate-400"
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
