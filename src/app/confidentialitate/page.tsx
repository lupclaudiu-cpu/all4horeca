import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { privacyDocument } from "@/lib/legal-content";

export const metadata: Metadata = { title: "Politica de confidențialitate" };

export default function Page() {
  return <LegalPage doc={privacyDocument} />;
}
