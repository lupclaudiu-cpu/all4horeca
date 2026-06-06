import { StatusPage } from "@/components/status-page";

export default function NotFoundRoutePage() {
  return (
    <StatusPage
      code="404"
      title="Pagina nu a fost găsită"
      description="Adresa accesată nu există sau pagina a fost mutată."
    />
  );
}
