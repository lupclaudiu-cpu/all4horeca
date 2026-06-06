"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartDrawer } from "@/features/cart/cart-drawer";
import { InstallApp } from "@/components/install-app";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname.startsWith("/restaurant/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register";

  if (isStandalone) return <>{children}</>;

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-white shadow-[0_0_60px_rgba(30,20,10,0.08)]">
      {children}
      <InstallApp />
      <BottomNav />
      <CartDrawer />
    </div>
  );
}
