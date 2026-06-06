import type { Metadata } from "next";
import { ProductsDashboardPage } from "@/features/dashboard/products-dashboard-page";

export const metadata: Metadata = { title: "Produse" };

export default function ProductsDashboardRoute() {
  return <ProductsDashboardPage />;
}
