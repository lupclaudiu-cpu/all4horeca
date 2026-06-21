"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataFlowDebugPanel } from "@/components/data-flow-debug-panel";
import { PwaRegister } from "@/components/pwa-register";
import { AuthProvider } from "@/features/auth/auth-context";
import { CartProvider } from "@/features/cart/cart-context";
import { CatalogProvider } from "@/features/catalog/catalog-context";
import { OrderProvider } from "@/features/orders/order-context";
import { RestaurantProvider } from "@/features/restaurant/restaurant-context";
import { SettingsProvider } from "@/features/settings/settings-context";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    publishDataFlowDebug({
      provider: "AppProviders",
      providerMounted: true,
      lastStep: "AppProviders mounted",
    });
  }, []);

  return (
    <AuthProvider>
      <RestaurantProvider>
        <CartProvider>
          <SettingsProvider>
            <CatalogProvider>
              <OrderProvider>
                <DataFlowDebugPanel />
                <AppShell>{children}</AppShell>
              </OrderProvider>
            </CatalogProvider>
          </SettingsProvider>
        </CartProvider>
      </RestaurantProvider>
      <PwaRegister />
    </AuthProvider>
  );
}
