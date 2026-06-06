import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { CartProvider } from "@/features/cart/cart-context";
import { PwaRegister } from "@/components/pwa-register";
import { OrderProvider } from "@/features/orders/order-context";
import { CatalogProvider } from "@/features/catalog/catalog-context";
import { SettingsProvider } from "@/features/settings/settings-context";
import { AuthProvider } from "@/features/auth/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ALL4HORECA", template: "%s | ALL4HORECA" },
  description: "Comandă rapid prin ALL4HORECA.",
  applicationName: "ALL4HORECA",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ALL4HORECA",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ff5a1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <AuthProvider>
          <CartProvider>
            <SettingsProvider>
              <CatalogProvider>
                <OrderProvider>
                  <AppShell>{children}</AppShell>
                </OrderProvider>
              </CatalogProvider>
            </SettingsProvider>
          </CartProvider>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
