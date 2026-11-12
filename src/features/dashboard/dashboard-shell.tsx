"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartIcon,
  CloseIcon,
  DashboardIcon,
  HistoryIcon,
  LogoutIcon,
  MenuIcon,
  OrdersIcon,
  ProductsIcon,
  SettingsIcon,
  StarIcon,
  UserIcon,
} from "@/components/icons";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { useAuth } from "@/features/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrders } from "@/features/orders/order-context";
import { NewOrderToast } from "@/features/dashboard/new-order-toast";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { AntoriaBrand } from "@/components/antoria-brand";
import { OrdersPauseControl } from "@/features/dashboard/orders-pause-control";
import { FirstRunGuide } from "@/features/dashboard/first-run-guide";
import { trialDaysLeft } from "@/lib/trial";

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
  { href: "/restaurant/dashboard/profil", label: "Profil restaurant", icon: UserIcon },
];

const MENU_PATHS = [
  "/restaurant/dashboard/meniu",
  "/restaurant/dashboard/categorii",
  "/restaurant/dashboard/produse",
];

// Pe telefon: 4 butoane jos. Restul paginilor sunt în „Mai mult”.
const mobilePrimary = [
  { href: "/restaurant/dashboard/comenzi", label: "Comenzi", icon: OrdersIcon },
  { href: "/restaurant/dashboard/meniu", label: "Meniu", icon: ProductsIcon },
  { href: "/restaurant/dashboard/promotii", label: "Promoții", icon: StarIcon },
];

const mobileMore = [
  { href: "/restaurant/dashboard", label: "Prezentare", icon: DashboardIcon },
  { href: "/restaurant/dashboard/istoric", label: "Istoric", icon: HistoryIcon },
  { href: "/restaurant/dashboard/rapoarte", label: "Rapoarte", icon: ChartIcon },
  { href: "/restaurant/dashboard/clienti", label: "Clienți", icon: UserIcon },
  { href: "/restaurant/dashboard/notificari", label: "Notificări", icon: OrdersIcon },
  { href: "/restaurant/dashboard/prezenta", label: "QR & SEO", icon: SettingsIcon },
  { href: "/restaurant/dashboard/setari", label: "Setări", icon: SettingsIcon },
  { href: "/restaurant/dashboard/profil", label: "Profil restaurant", icon: UserIcon },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/restaurant/dashboard") return pathname === href;
  if (href === "/restaurant/dashboard/meniu") {
    return MENU_PATHS.some((path) => pathname.startsWith(path));
  }
  return pathname.startsWith(href);
}

const staffNavigation = [
  { href: "/restaurant/dashboard/locatie", label: "Locație", icon: OrdersIcon },
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

  const isStaff = profile?.role === "restaurant_staff";
  const visibleNavigation = isStaff ? staffNavigation : navigation;
  const moreItems = isStaff ? staffNavigation : mobileMore;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive =
    !isStaff &&
    !mobilePrimary.some((item) => isActivePath(pathname, item.href));

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  useEffect(() => {
    if (isStaff && !pathname.startsWith("/restaurant/dashboard/locatie")) {
      router.replace("/restaurant/dashboard/locatie");
    }
  }, [isStaff, pathname, router]);

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
          {visibleNavigation.map((item) => {
            const active =
              isActivePath(pathname, item.href) ||
              (item.href.endsWith("/produse") &&
                pathname.startsWith("/restaurant/dashboard/meniu"));
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
          <div className="flex shrink-0 items-center gap-2">
            {!isStaff && currentRestaurant && (
              <OrdersPauseControl disabled={Boolean(accessLocked)} />
            )}
            <Link
              href={
                currentRestaurant ? `/clienti/${currentRestaurant.slug}` : "/admin"
              }
              className="hidden rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100 sm:block"
            >
              Aplicație
            </Link>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          {profile?.role === "super_admin" && currentRestaurant && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900">
              <span>Editezi ca superadmin: {currentRestaurant.name}</span>
              <Link href={`/admin/restaurante/${currentRestaurant.id}`} className="text-xs font-black text-amber-800 underline">
                Înapoi la detalii restaurant
              </Link>
            </div>
          )}
          {!accessLocked &&
            currentRestaurant?.status === "trial" &&
            currentRestaurant.trialExpiresAt && (
              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-900">
                <p>
                  Perioadă de testare: mai ai{" "}
                  {trialDaysLeft(currentRestaurant.trialExpiresAt)} zile (până la{" "}
                  {new Date(currentRestaurant.trialExpiresAt).toLocaleDateString(
                    "ro-RO",
                  )}
                  ). Configurează produsele, promoțiile și programul.
                </p>
                <p className="mt-2 font-semibold text-blue-800">
                  Ca să încerci o comandă, deschide link-ul public al
                  restaurantului și intră cu telefonul 0770 111 111, codul
                  123456. Comenzile reale și SMS-urile se activează la lansare.
                </p>
              </div>
            )}
          {accessLocked && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
              Accesul restaurantului este suspendat. Contactează ALL4HORECA pentru reactivare.
            </div>
          )}
          {children}
        </main>

        <nav
          aria-label="Navigare principală"
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200/80 bg-white/95 px-1 pt-1.5 shadow-[0_-12px_35px_rgba(15,23,42,.06)] backdrop-blur-2xl lg:hidden"
        >
          {isStaff ? (
            <>
              {staffNavigation.map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={navigationHref(item.href)}
                  label={item.label}
                  icon={item.icon}
                  active={isActivePath(pathname, item.href)}
                />
              ))}
              <button
                type="button"
                onClick={() => void logout()}
                className="flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-slate-500"
              >
                <LogoutIcon className="size-5" />
                Ieșire
              </button>
            </>
          ) : (
            <>
              {mobilePrimary.map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={navigationHref(item.href)}
                  label={item.label}
                  icon={item.icon}
                  active={isActivePath(pathname, item.href)}
                  badge={
                    item.href.endsWith("/comenzi") ? newOrdersCount : 0
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-expanded={moreOpen}
                aria-controls="dashboard-more-sheet"
                className={`flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold ${
                  moreActive || moreOpen ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <MenuIcon className="size-5" />
                Mai mult
              </button>
            </>
          )}
        </nav>

        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Închide meniul"
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <div
              id="dashboard-more-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Mai mult"
              className="safe-bottom absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-white p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between px-2 pb-3">
                <p className="text-base font-black text-slate-950">Mai mult</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Închide"
                  className="grid size-11 place-items-center rounded-full text-slate-500"
                >
                  <CloseIcon className="size-5" />
                </button>
              </div>
              <ul className="divide-y divide-slate-100">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={navigationHref(item.href)}
                        onClick={() => setMoreOpen(false)}
                        className={`flex min-h-14 items-center gap-3 rounded-xl px-3 text-sm font-black ${
                          active ? "bg-blue-50 text-blue-700" : "text-slate-800"
                        }`}
                      >
                        <Icon className="size-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-red-700"
                  >
                    <LogoutIcon className="size-5" />
                    Ieșire din cont
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
        {!isStaff && <FirstRunGuide />}
        <NewOrderToast />
      </div>
    </div>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold ${
        active ? "text-blue-600" : "text-slate-500"
      }`}
    >
      <span className="relative">
        <Icon className="size-5" />
        {badge > 0 && (
          <span className="absolute -right-3 -top-2 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
            {badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
