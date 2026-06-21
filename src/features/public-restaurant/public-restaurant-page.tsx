"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { AntoriaBrand } from "@/components/antoria-brand";
import { PromotionCarousel } from "@/components/promotion-carousel";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
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
  const featuredProducts = products.filter((product) => product.featured);
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

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="antoria-gradient relative overflow-hidden px-4 pb-7 pt-5 text-white sm:pb-10 sm:pt-7">
        <div className="absolute -right-24 top-8 size-72 rounded-full border border-cyan-300/20" />
        <div className="absolute -left-20 bottom-0 size-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <AntoriaBrand inverse />
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100 backdrop-blur">
              Comandă direct de la restaurant
            </span>
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 min-[380px]:flex-row sm:items-center">
              <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-[1.4rem] border border-white/15 bg-white/10 text-xl font-black shadow-xl sm:size-24">
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
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  Meniu digital
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                  {restaurant.name}
                </h1>
                <p className="mt-2 line-clamp-1 text-sm text-slate-300">
                  {restaurant.address || "Comandă rapid din aplicația restaurantului."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <HeroBadge
                    tone={restaurantOpen ? "green" : "red"}
                    label={restaurantOpen ? "Deschis" : restaurantStatus.label}
                  />
                  <HeroBadge
                    label={`ETA ${settings.estimatedDeliveryTime || "30-45 min"}`}
                  />
                  <HeroBadge
                    label={`Livrare ${formatPrice(settings.deliveryFee)}`}
                  />
                  <HeroBadge
                    label={`Comandă minimă ${formatPrice(settings.minimumOrderValue)}`}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </header>

      <PromotionCarousel restaurantId={restaurant.id} />

      <div className="sticky top-0 z-20 overflow-x-auto border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-2xl">
        <div className="mx-auto flex w-max max-w-6xl gap-2">
          <CategoryButton
            active={effectiveSelected === "all"}
            onClick={() => selectCategory("all")}
          >
            Toate produsele
          </CategoryButton>
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              active={effectiveSelected === category.id}
              onClick={() => selectCategory(category.id)}
            >
              <span>{category.icon}</span>
              {category.name}
            </CategoryButton>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-3 py-7 sm:px-5">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
            <p className="px-3 pb-3 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Categorii meniu
            </p>
            <div className="space-y-1">
              <DesktopCategoryButton
                active={effectiveSelected === "all"}
                onClick={() => selectCategory("all")}
              >
                Toate produsele
              </DesktopCategoryButton>
              {categories.map((category) => (
                <DesktopCategoryButton
                  key={category.id}
                  active={effectiveSelected === category.id}
                  onClick={() => selectCategory(category.id)}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </DesktopCategoryButton>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {effectiveSelected === "all" && featuredProducts.length > 0 && (
            <div className="mb-7 rounded-[1.75rem] border border-blue-100 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,.07)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600">
                    Selecția restaurantului
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Recomandate pentru tine
                  </h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-700">
                  {featuredProducts.length} produse
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
                {featuredProducts.slice(0, 6).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openProduct(product.id)}
                    className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-left transition hover:-translate-y-0.5"
                  >
                    <span className="block line-clamp-1 text-sm font-black">
                      {product.name}
                    </span>
                    <span className="mt-1 block text-xs font-bold text-blue-700">
                      {formatPrice(product.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {process.env.NODE_ENV === "development" && (
            <RenderDebugBox
              rows={[
                ["Context loading", String(contextLoading)],
                ["Direct Products", String(initialProducts.length)],
                ["Context Products", String(contextProducts.length)],
                ["Filtered Products", String(products.length)],
                ["Visible Products", String(visible.length)],
                ["Direct Categories", String(initialCategories.length)],
                ["Context Categories", String(contextCategories.length)],
                ["Selected", effectiveSelected],
                ["Direct Error", initialCatalogError ?? "-"],
                ["Context Error", contextCatalogError ?? "-"],
              ]}
            />
          )}

          <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-3 sm:gap-5">
            {visible.map((product) => (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,.07)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_55px_rgba(37,99,235,.12)]"
                  >
                    <button
                      type="button"
                      onClick={() => openProduct(product.id)}
                      className="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50"
                    >
                      <SafeImage
                        src={product.image}
                        alt={product.name}
                        fallbackLabel={product.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        {product.featured && <Tag text="Recomandat" />}
                        {product.bestseller && <Tag text="Bestseller" />}
                        {product.isNew && <Tag text="Nou" />}
                      </div>
                    </button>
                    <div className="p-3 sm:p-4">
                      <button
                        type="button"
                        onClick={() => openProduct(product.id)}
                        className="block w-full text-left"
                      >
                        <h2 className="line-clamp-1 text-sm font-black sm:text-base">
                          {product.name}
                        </h2>
                      </button>
                      <p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-4 text-slate-500">
                        {product.shortDescription}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-black text-blue-700">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => quickAdd(product)}
                          className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20 transition active:scale-95"
                          aria-label={`Adaugă ${product.name}`}
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
          </div>
          {initialCatalogError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Catalogul nu a putut fi incarcat: {initialCatalogError}
            </div>
          )}
        </section>
      </div>
      {!visible.length && (
        <p className="px-6 py-20 text-center text-sm font-bold text-slate-500">
          Nu sunt produse disponibile în această categorie.
        </p>
      )}
    </main>
  );
}

function HeroBadge({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "green" | "red";
}) {
  const styles = {
    blue: "border-white/10 bg-white/10 text-cyan-100",
    green: "border-emerald-300/20 bg-emerald-400/15 text-emerald-100",
    red: "border-red-300/20 bg-red-400/15 text-red-100",
  };
  return (
    <span
      className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-black transition ${
        active ?
           "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50"
      }`}
    >
      {children}
    </button>
  );
}

function DesktopCategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-black transition ${
        active ?
           "bg-slate-950 text-white shadow-lg"
          : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-800"
      }`}
    >
      {children}
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
