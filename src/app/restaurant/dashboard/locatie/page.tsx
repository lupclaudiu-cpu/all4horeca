import type { Metadata } from "next";
import { LocationPage } from "@/features/dashboard/location-page";

export const metadata: Metadata = { title: "Locație" };

export default function Page() {
  return <LocationPage />;
}
