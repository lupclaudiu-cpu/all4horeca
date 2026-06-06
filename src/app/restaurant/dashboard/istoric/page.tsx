import type { Metadata } from "next";
import { OrderHistoryPage } from "@/features/dashboard/order-history-page";

export const metadata: Metadata = { title: "Istoric comenzi" };

export default function OrderHistoryRoute() {
  return <OrderHistoryPage />;
}
