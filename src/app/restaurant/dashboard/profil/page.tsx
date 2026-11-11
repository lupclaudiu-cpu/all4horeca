import type { Metadata } from "next";
import { RestaurantProfilePage } from "@/features/dashboard/restaurant-profile-page";

export const metadata: Metadata = { title: "Profil restaurant" };

export default function RestaurantProfileRoute() {
  return <RestaurantProfilePage />;
}
