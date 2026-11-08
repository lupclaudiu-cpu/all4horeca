"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { PromotionCarousel } from "@/components/promotion-carousel";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/cart-context";
import { useCatalog } from "@/features/catalog/catalog-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";
import type { Category, CurrentRestaurant, Product } from "@/lib/types";

export function PublicRestaurantPage({
  restaurant,
  initialProducts,
  initialCategories,
  initialCatalogError = null,
  initialCategory = "all",
}: {
  restaurant: CurrentRestaurant;
  initialProducts: Product[];
  initialCategories: Category[];
  initialCatalogError?: string | null;
  initialCategory?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, openCart } = useCart();
  const { settings, restaurantOpen, restaurantStatus } =
    useRestaurantSettings();
  const {
    products: contextProducts,
    categories: contextCategories,
    loading: contextLoading,
    error: contextCatalogError,
  } = useCatalog();
  const [selected, setSelected] = useState(initialCategory);

  const products = initialProducts.filter(
    (product) => product.active !== false && !product.soldOut,
  );
  const categories = initialCategories.filter(
    (category) => category.active !== false,
  );
  const categoryExists = categories.some((category) => category.id === selected);
  const effectiveSelected =
    selected === "all" || categoryExists ? selected : "all";
  const visibleSource =
    effectiveSelected === "all" ?
       products
      : products.filter((product) => product.categoryId === effectiveSelected);
  const visible = [...visibleSource].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );

  useEffect(() => {
    publishDataFlowDebug({
      provider: "PublicRestaurantPage",
      providerMounted: true,
      route: window.location.pathname,
      restaurantId: restaurant.id,
      slug: restaurant.slug,
      productsCount: initialProducts.length,
      categoriesCount: initialCategories.length,
      lastStep: "PublicRestaurantPage mounted",
      source: "direct-public-catalog",
    });
  }, [
    initialCategories.length,
    initialProducts.length,
    restaurant.id,
    restaurant.slug,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.info("[DEBUG]", {
      component: "PublicRestaurantPage",
      directProducts: initialProducts.length,
      directCategories: initialCategories.length,
      contextLoading,
      contextProducts: contextProducts.length,
      contextCategories: contextCategories.length,
      filteredProducts: products.length,
      visibleProducts: visible.length,
      filteredCategories: categories.length,
      selected,
      effectiveSelected,
      directCatalogError: initialCatalogError,
      contextCatalogError,
    });
  }, [
    contextCatalogError,
    contextCategories.length,
    contextLoading,
    contextProducts.length,
    categories.length,
    effectiveSelected,
    initialCatalogError,
    initialCategories.length,
    initialProducts.length,
    products.length,
    selected,
    visible.length,
  ]);

  useEffect(() => {
    const scrollKey = `menu-scroll:${window.location.pathname}${window.location.search}`;
    const savedScroll = window.sessionStorage.getItem(scrollKey);
    if (!savedScroll) return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: Number(savedScroll), behavior: "auto" });
      window.sessionStorage.removeItem(scrollKey);
    });
  }, [selected]);

  const selectCategory = (categoryId: string) => {
    setSelected(categoryId);
    const url = new URL(window.location.href);
    if (categoryId === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", categoryId);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (productId: string) => {
    publishDataFlowDebug({
      provider: "PublicRestaurantPage",
      providerMounted: true,
      route: window.location.pathname,
      restaurantId: restaurant.id,
      slug: restaurant.slug,
      productsCount: initialProducts.length,
      categoriesCount: initialCategories.length,
      lastStep: `Product click handler: ${productId}`,
      source: "direct-public-catalog",
    });
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem(
      `menu-scroll:${returnTo}`,
      String(window.scrollY),
    );
    router.push(`/produs/${productId}?from=${encodeURIComponent(returnTo)}`);
  };

  const quickAdd = (product: (typeof products)[number]) => {
    publishDataFlowDebug({
      provider: "PublicRestaurantPage",
      providerMounted: true,
      route: window.location.pathname,
      restaurantId: restaurant.id,
      slug: restaurant.slug,
      productsCount: initialProducts.length,
      categoriesCount: initialCategories.length,
      lastStep: `Add to cart handler: ${product.id}`,
      source: "direct-public-catalog",
    });
    if (product.optionGroups?.some((group) => group.required)) {
      openProduct(product.id);
      return;
    }
    addItem(product);
    openCart();
  };

  const accent = restaurant.primaryColor || "#0e7490";
  const heroStatus = restaurantOpen ? "Deschis" : restaurantStatus.label;

  return (
    <main className="min-h-screen bg-slate-100 pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5">
          <div
            className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-black"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {restaurant.logoUrl ? (
              <SafeImage
                src={restaurant.logoUrl}
                alt=""
                fallbackLabel={restaurant.name}
                fill
                className="object-cover"
              />
            ) : (
              restaurant.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-black leading-tight text-slate-950">
              {restaurant.name}
            </h1>
            <p
              className={`flex items-center gap-1.5 text-xs font-bold ${
                restaurantOpen ? "text-emerald-800" : "text-red-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${restaurantOpen ? "bg-emerald-600" : "bg-red-600"}`}
              />
              {heroStatus}
              {settings.openingTime && settings.closingTime
                ? ` · ${settings.openingTime}–${settings.closingTime}`
                : ""}
            </p>
          </div>
          <a
            href={restaurant.phone ? `tel:${restaurant.phone}` : "/cont"}
            aria-label="Ajutor: sună restaurantul"
            className="grid size-11 place-items-center rounded-full text-slate-700"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
            </svg>
          </a>
          <a
            href="/cont/notificari"
            aria-label="Notificări"
            className="grid size-11 place-items-center rounded-full text-slate-700"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
              <path d="M10 21h4" />
            </svg>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        {!user && (
          <div
            className="mx-3 mt-3 flex items-center gap-3 rounded-2xl py-2 pl-4 pr-2 text-white"
            style={{ backgroundColor: accent }}
          >
            <strong className="flex-1 text-base">Comandă acum</strong>
            <a
              href="/checkout"
              className="grid min-h-11 place-items-center rounded-xl bg-white px-4 text-sm font-black text-slate-950"
            >
              Intră cu telefonul
            </a>
          </div>
        )}

        <PromotionCarousel restaurantId={restaurant.id} accent={accent} />

        <div className="flex gap-2 px-3 pt-4">
          <nav
            aria-label="Categorii"
            className="sticky top-16 flex h-fit w-[84px] shrink-0 flex-col items-center gap-1.5 self-start"
          >
            <CategoryRailButton
              accent={accent}
              active={effectiveSelected === "all"}
              onClick={() => selectCategory("all")}
              icon="☰"
              label="Toate"
            />
            {categories.map((category) => (
              <CategoryRailButton
                key={category.id}
                accent={accent}
                active={effectiveSelected === category.id}
                onClick={() => selectCategory(category.id)}
                icon={category.icon}
                label={category.name}
              />
            ))}
          </nav>

          <section className="min-w-0 flex-1 space-y-3">
            {process.env.NODE_ENV === "development" && (
              <RenderDebugBox
                rows={[
                  ["Context loading", String(contextLoading)],
                  ["Direct Products", String(initialProducts.length)],
                  ["Context Products", String(contextProducts.length)],
                  ["Visible Products", String(visible.length)],
                  ["Selected", effectiveSelected],
                  ["Direct Error", initialCatalogError ?? "-"],
                  ["Context Error", contextCatalogError ?? "-"],
                ]}
              />
            )}
            {visible.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => openProduct(product.id)}
                  aria-label={`Detalii ${product.name}`}
                  className="relative block h-36 w-full overflow-hidden bg-slate-200"
                >
                  <SafeImage
                    src={product.image}
                    alt=""
                    fallbackLabel={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 70vw, 400px"
                  />
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {product.featured && <Tag text="Recomandat" />}
                    {product.bestseller && <Tag text="Bestseller" />}
                    {product.isNew && <Tag text="Nou" />}
                  </div>
                </button>
                <div className="flex items-start gap-2 px-3 pt-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black leading-tight text-slate-950">
                      {product.name}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-600">
                      {product.shortDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProduct(product.id)}
                    aria-label={`Informații ${product.name}`}
                    className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center text-slate-700"
                  >
                    <span className="grid size-6 place-items-center rounded-full border-[1.8px] border-slate-700 text-[13px] font-black">
                      i
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-end gap-3 px-3 pb-3 pt-1">
                  <strong className="text-lg text-slate-950">
                    {formatPrice(product.price)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => quickAdd(product)}
                    className="grid size-11 place-items-center rounded-full text-white active:scale-95"
                    style={{ backgroundColor: accent }}
                    aria-label={`Adaugă ${product.name}`}
                  >
                    <PlusIcon className="size-5" />
                  </button>
                </div>
              </article>
            ))}
            {initialCatalogError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                Catalogul nu a putut fi încărcat: {initialCatalogError}
              </div>
            )}
            {!visible.length && (
              <p className="py-16 text-center text-sm font-bold text-slate-600">
                Nu sunt produse disponibile în această categorie.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function CategoryRailButton({
  active,
  onClick,
  icon,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition ${
        active ? "text-white" : "bg-transparent text-slate-700"
      }`}
      style={active ? { backgroundColor: accent } : undefined}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className="line-clamp-2 break-words text-[11px] font-bold leading-tight">
        {label}
      </span>
    </button>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-cyan-100 bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-cyan-700">
      {text}
    </span>
  );
}

function RenderDebugBox({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-300 bg-white p-3 text-[11px] font-bold text-slate-700">
      <p className="text-xs font-black text-blue-700">RENDER DEBUG</p>
      <dl className="mt-2 grid grid-cols-2 gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-slate-400">{label}</dt>
            <dd className="truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
