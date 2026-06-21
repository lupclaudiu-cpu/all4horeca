import type { Metadata } from "next";
import { NotificationsDashboardPage } from "@/features/dashboard/notifications-dashboard-page";

export const metadata: Metadata = { title: "Notificări clienți" };

export default function NotificationsDashboardRoute() {
  return <NotificationsDashboardPage />;
}
