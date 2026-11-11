import type { Metadata } from "next";
import { MenuHubPage } from "@/features/dashboard/menu-hub-page";

export const metadata: Metadata = { title: "Meniu" };

export default function MenuHubRoute() {
  return <MenuHubPage />;
}
