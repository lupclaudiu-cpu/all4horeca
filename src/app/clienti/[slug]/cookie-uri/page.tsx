import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getRestaurantLegalParty } from "@/lib/restaurant-legal";
import { buildRestaurantCookies } from "@/lib/restaurant-legal-content";

export const metadata: Metadata = { title: "Cookie-uri" };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = await getRestaurantLegalParty(slug);
  if (!party) notFound();
  return <LegalPage doc={buildRestaurantCookies(party)} basePath={`/clienti/${slug}`} />;
}
