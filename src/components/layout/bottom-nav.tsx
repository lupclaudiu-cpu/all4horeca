"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, OrdersIcon, UserIcon } from "@/components/icons";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";

export function BottomNav() {
  const pathname = usePathname();
  const { currentRestaurant } = useRestaurant();
  const publicSlug = pathname.match(/^\/(?:clienti|r)\/([^/]+)/)?.[1];
  const menuHref = currentRestaurant ?
     `/clienti/${currentRestaurant.slug}`
    : publicSlug ?
       `/clienti/${publicSlug}`
      : "/";
  const items = [
    {
      href: menuHref,
      label: "Meniu",
      icon: MenuIcon,
    },
    { href: "/comenzi", label: "Comenzi", icon: OrdersIcon },
    { href: "/cont", label: "Cont", icon: UserIcon },
  ];

  useEffect(() => {
    publishDataFlowDebug({
      provider: "BottomNav",
      providerMounted: true,
      route: pathname,
      slug: currentRestaurant?.slug ?? publicSlug ?? null,
      restaurantId: currentRestaurant?.id ?? null,
      lastStep: "BottomNav mounted",
    });
  }, [currentRestaurant?.id, currentRestaurant?.slug, pathname, publicSlug]);

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-4 pt-2 shadow-[0_-12px_35px_rgba(15,23,42,.06)] backdrop-blur-2xl md:left-1/2 md:max-w-6xl md:-translate-x-1/2">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        {items.map((item) => {
          const active =
            item.label === "Meniu"
              ? pathname.startsWith("/clienti/") ||
                pathname.startsWith("/r/")
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${active ? "text-blue-600" : "text-slate-400 hover:text-slate-700"}`}>
              <Icon className="size-6" />{item.label}
              {active && <span className="absolute -top-2 h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
