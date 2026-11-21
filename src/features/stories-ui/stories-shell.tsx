"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { STORIES_CART_BUMP_EVENT, STORIES_CART_FALLBACK_ID, STORIES_CART_TARGET_ID } from "@/features/stories-ui/fly-to-cart";
import { BagIcon, HomeIcon, OrdersIcon, UserIcon } from "@/features/stories-ui/stories-icons";

/** Bara de jos plutitoare din varianta „Stories”. Aceleași destinații ca bara clasică. */
export function StoriesBottomNav() {
  const pathname = usePathname();
  const { currentRestaurant } = useRestaurant();
  const { itemCount, openCart } = useCart();
  const slug = currentRestaurant?.slug ?? pathname.match(/^\/(?:clienti|r)\/([^/]+)/)?.[1];
  const menuHref = slug ? `/clienti/${slug}` : "/";
  const items = [
    { href: menuHref, label: "Meniu", icon: HomeIcon, active: pathname.startsWith("/clienti/") || pathname.startsWith("/r/") || pathname.startsWith("/produs/") },
    { href: "/comenzi", label: "Comenzi", icon: OrdersIcon, active: pathname.startsWith("/comenzi") },
    { href: "/cont", label: "Cont", icon: UserIcon, active: pathname.startsWith("/cont") },
  ];

  return (
    <nav
      aria-label="Navigare"
      className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-[22px] bg-[#0E1F19] px-2 text-[10px] font-bold text-[#9FB3AA] shadow-[0_12px_30px_rgba(14,31,25,.35)]"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={`flex min-w-16 flex-col items-center gap-[3px] py-1 ${item.active ? "text-white" : ""}`}>
            <Icon className="size-[22px]" />
            {item.label}
          </Link>
        );
      })}
      <button id={STORIES_CART_FALLBACK_ID} type="button" onClick={openCart} className="relative flex min-w-16 flex-col items-center gap-[3px] py-1" aria-label={`Coș, ${itemCount} produse`}>
        <BagIcon className="size-[22px]" />
        Coș
        {itemCount > 0 && (
          <span className="absolute right-3 top-[-4px] grid min-w-5 place-items-center rounded-full bg-[#E3B33C] px-1 text-[10px] font-black text-[#0E1F19]">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </nav>
  );
}

/** Bara verde „Vezi coșul” care plutește deasupra meniului cât timp coșul are produse. */
export function StoriesCartBar() {
  const pathname = usePathname();
  const { itemCount, total, openCart, isOpen } = useCart();
  const { currentRestaurant } = useRestaurant();
  const { settings } = useRestaurantSettings();
  const [bump, setBump] = useState(0);
  const accent = currentRestaurant?.primaryColor || "#173A2E";
  const menuRoute = pathname.startsWith("/clienti/") || pathname.startsWith("/r/");

  useEffect(() => {
    const onBump = () => setBump((value) => value + 1);
    window.addEventListener(STORIES_CART_BUMP_EVENT, onBump);
    return () => window.removeEventListener(STORIES_CART_BUMP_EVENT, onBump);
  }, []);

  if (!menuRoute || isOpen || itemCount === 0) return null;

  return (
    <button
      key={`bar-${itemCount > 0}`}
      type="button"
      onClick={openCart}
      className="stories-rise fixed inset-x-4 bottom-[calc(max(16px,env(safe-area-inset-bottom))+76px)] z-40 mx-auto flex h-[60px] max-w-md items-center rounded-[20px] pl-2.5 pr-2 text-left text-white shadow-[0_14px_30px_rgba(23,58,46,.4)]"
      style={{ backgroundColor: accent }}
    >
      <span id={STORIES_CART_TARGET_ID} key={bump} className={`relative grid size-11 place-items-center rounded-[14px] bg-white/15 ${bump ? "stories-bump" : ""}`}>
        <BagIcon className="size-[22px]" />
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[#E3B33C] px-1 text-[11px] font-black text-[#0E1F19]">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      </span>
      <span className="ml-3 flex-1">
        <span className="block text-[15px] font-black">Vezi coșul</span>
        {settings.estimatedDeliveryTime && (
          <span className="block text-[11.5px] font-semibold opacity-75">Livrare în {settings.estimatedDeliveryTime}</span>
        )}
      </span>
      <span key={total} className="stories-pop grid h-11 place-items-center rounded-[14px] bg-white px-4 text-[17px] font-black" style={{ color: accent }}>
        {formatPrice(total)}
      </span>
    </button>
  );
}
