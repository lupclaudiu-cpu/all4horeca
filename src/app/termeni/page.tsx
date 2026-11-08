import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { termsDocument } from "@/lib/legal-content";

export const metadata: Metadata = { title: "Termeni și condiții" };

export default function Page() {
  return <LegalPage doc={termsDocument} />;
}
