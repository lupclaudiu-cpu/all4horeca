import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { cookiesDocument } from "@/lib/legal-content";

export const metadata: Metadata = { title: "Cookie-uri" };

export default function Page() {
  return <LegalPage doc={cookiesDocument} />;
}
