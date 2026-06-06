import type { Metadata } from "next";
import { StatusPage } from "@/components/status-page";

export const metadata: Metadata = {
  title: "Acces interzis",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="Nu ai acces la această zonă"
      description="Contul autentificat nu are rolul necesar pentru această pagină."
    />
  );
}
