import type { Metadata } from "next";
import { CheckoutPage } from "@/features/checkout/checkout-page";

export const metadata: Metadata = { title: "Finalizare comandă" };

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
