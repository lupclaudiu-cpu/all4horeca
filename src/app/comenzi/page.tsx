import type { Metadata } from "next";
import { OrdersPage } from "@/features/orders/orders-page";

export const metadata: Metadata = { title: "Comenzile mele" };

export default async function OrdersRoute({
  searchParams,
}: {
  searchParams: Promise<{ plasata?: string }>;
}) {
  const { plasata } = await searchParams;
  return <OrdersPage placedOrderNumber={plasata} />;
}
