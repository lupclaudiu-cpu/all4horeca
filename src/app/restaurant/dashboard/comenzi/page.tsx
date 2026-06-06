import type { Metadata } from "next";
import { LiveOrdersPage } from "@/features/dashboard/live-orders-page";

export const metadata: Metadata = { title: "Comenzi live" };

export default function LiveOrdersRoute() {
  return <LiveOrdersPage />;
}
