import type { Metadata } from "next";
import { PromotionsDashboardPage } from "@/features/dashboard/promotions-dashboard-page";

export const metadata: Metadata = { title: "Promoții" };

export default function PromotionsDashboardRoute() {
  return <PromotionsDashboardPage />;
}
