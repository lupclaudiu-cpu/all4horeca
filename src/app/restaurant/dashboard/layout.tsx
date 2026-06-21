import type { Metadata } from "next";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";
import { requireServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: { default: "Panou restaurant", template: "%s | Panou restaurant" },
  robots: { index: false, follow: false },
};

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerRole(
    ["restaurant_owner", "super_admin"],
    "/restaurant/dashboard",
  );
  return (
    <DashboardShell>{children}</DashboardShell>
  );
}
