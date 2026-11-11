"use client";

import Link from "next/link";
import { ChevronRightIcon, PlusIcon, ProductsIcon } from "@/components/icons";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { PublicMenuPreviewButton } from "@/features/dashboard/public-menu-preview-button";
import { useCatalog } from "@/features/catalog/catalog-context";
import { useAuth } from "@/features/auth/auth-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";

/** Pagina „Meniu” din bara de jos (telefon): Categorii, Produse și previzualizare. */
export function MenuHubPage() {
  const { products, categories, loading } = useCatalog();
  const { profile } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const withRestaurant = (href: string) =>
    profile?.role === "super_admin" && currentRestaurant ?
       `${href}${href.includes("?") ? "&" : "?"}restaurant=${currentRestaurant.id}`
      : href;
  const activeProducts = products.filter((product) => product.active !== false).length;

  return (
    <div className="mx-auto max-w-3xl">
      <DashboardHeader
        eyebrow="Catalog"
        title="Meniu"
        description="Categoriile și produsele pe care le văd clienții în meniul online."
        action={<PublicMenuPreviewButton />}
      />

      <div className="mt-6 grid gap-3">
        <HubLink
          href={withRestaurant("/restaurant/dashboard/categorii")}
          title="Categorii"
          detail={loading ? "Se încarcă..." : `${categories.length} categorii`}
        />
        <HubLink
          href={withRestaurant("/restaurant/dashboard/produse")}
          title="Produse"
          detail={
            loading ?
               "Se încarcă..."
              : `${activeProducts} active din ${products.length} produse`
          }
        />
      </div>

      <section className="mt-6 rounded-[1.75rem] border border-blue-100 bg-blue-50/70 p-5">
        <h2 className="text-lg font-black text-slate-950">Adaugă produse mai repede</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Scrie mai multe produse deodată (nume, preț, categorie) sau importă
          meniul dintr-un fișier Excel/CSV.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={withRestaurant("/restaurant/dashboard/produse?rapid=1")}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
          >
            <PlusIcon className="size-4" />
            Adăugare rapidă
          </Link>
          <Link
            href={withRestaurant("/restaurant/dashboard/produse?import=1")}
            className="inline-flex min-h-11 items-center rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700"
          >
            Import Excel / CSV
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white">
        <h2 className="text-lg font-black">Așa văd clienții</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          Deschide meniul public într-un tab nou, exact cum îl vede un client.
          {currentRestaurant?.status === "trial" &&
            " Cât timp ești în testare, meniul afișează avertizarea de mod test."}
        </p>
        <PublicMenuPreviewButton variant="dark" className="mt-4" />
      </section>
    </div>
  );
}

function HubLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white">
        <ProductsIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black text-slate-950">{title}</span>
        <span className="block text-xs font-bold text-slate-500">{detail}</span>
      </span>
      <ChevronRightIcon className="size-5 text-slate-400" />
    </Link>
  );
}
