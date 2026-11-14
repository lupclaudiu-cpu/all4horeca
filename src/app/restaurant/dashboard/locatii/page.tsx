import type { Metadata } from "next";
import { LocationsPage } from "@/features/dashboard/locations-page";

export const metadata: Metadata = { title: "Locațiile mele" };

export default function LocationsRoute() {
  return <LocationsPage />;
}
