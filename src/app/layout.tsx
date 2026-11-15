import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ALL4HORECA", template: "%s | ALL4HORECA" },
  description: "Aplicație de comenzi online pentru restaurante, cafenele și fast-food.",
  applicationName: "ALL4HORECA",
  // Aplicația nu se promovează pe Google; SEO se face pe all4horeca.ro.
  robots: { index: false, follow: false },
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
  themeColor: "#14231D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
