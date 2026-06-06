import type { Metadata } from "next";
import { CustomersPage } from "@/features/dashboard/customers-page";

export const metadata: Metadata = { title: "Clienți" };

export default function CustomersRoute() {
  return <CustomersPage />;
}
