import { redirect } from "next/navigation";

// Pagina de prezentare este pe https://all4horeca.ro. Aplicatia ramane pe comanda.all4horeca.ro.
export default function HomePage() {
  redirect("https://all4horeca.ro");
}
