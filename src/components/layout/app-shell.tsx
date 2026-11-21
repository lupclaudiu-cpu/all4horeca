"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartDrawer } from "@/features/cart/cart-drawer";
import { InstallApp } from "@/components/install-app";
import { FloatingCartButton } from "@/features/cart/floating-cart-button";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { StoriesCartSheet } from "@/features/stories-ui/stories-cart-sheet";
import { StoriesBottomNav, StoriesCartBar } from "@/features/stories-ui/stories-shell";
import { usesStoriesUi } from "@/lib/ui-variant";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentRestaurant } = useRestaurant();
  const isStandalone =
    pathname.startsWith("/restaurant/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/demo/") ||
    pathname === "/" ||
    pathname === "/app" ||
    pathname === "/login" ||
    pathname === "/register";

  if (isStandalone) return <>{children}</>;

  const publicSlug = pathname.match(/^\/(?:clienti|r)\/([^/]+)/)?.[1];
  if (usesStoriesUi(publicSlug ?? currentRestaurant?.slug)) {
    return (
      <div className="mx-auto min-h-screen max-w-6xl bg-white">
        {children}
        <InstallApp bottomClassName="bottom-[164px]" />
        <StoriesCartBar />
        <StoriesBottomNav />
        <StoriesCartSheet />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-slate-50 shadow-[0_0_80px_rgba(15,23,42,0.10)]">
      {children}
      <InstallApp />
      <FloatingCartButton />
      <BottomNav />
      <CartDrawer />
    </div>
  );
}
