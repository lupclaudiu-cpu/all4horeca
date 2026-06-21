import type { Metadata } from "next";
import { CustomerNotificationSettings } from "@/features/notifications/customer-notification-settings";

export const metadata: Metadata = { title: "Notificări" };

export default function CustomerNotificationsRoute() {
  return <CustomerNotificationSettings />;
}
