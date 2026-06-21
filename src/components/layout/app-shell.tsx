"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartDrawer } from "@/features/cart/cart-drawer";
import { InstallApp } from "@/components/install-app";
import { FloatingCartButton } from "@/features/cart/floating-cart-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname.startsWith("/restaurant/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/demo/") ||
    pathname === "/" ||
    pathname === "/app" ||
    pathname === "/login" ||
    pathname === "/register";

  if (isStandalone) return <>{children}</>;

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
