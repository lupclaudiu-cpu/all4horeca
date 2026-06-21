import type { Metadata } from "next";
import { ReportsPage } from "@/features/dashboard/reports-page";

export const metadata: Metadata = { title: "Rapoarte operaționale" };

export default function ReportsRoute() {
  return <ReportsPage />;
}
