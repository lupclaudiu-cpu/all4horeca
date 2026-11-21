"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/cart-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { ProductSheet } from "@/features/stories-ui/product-sheet";
import { StoryViewer, type Story } from "@/features/stories-ui/story-viewer";
import { flyToCart } from "@/features/stories-ui/fly-to-cart";
import {
  CheckIcon,
  ChevronRightIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
  WalkIcon,
} from "@/features/stories-ui/stories-icons";
import { toTelHref } from "@/lib/phone";
import { needsRequiredChoice } from "@/lib/product-selection";
import type { Category, CurrentRestaurant, Product, Promotion } from "@/lib/types";
import { getActivePromotions } from "@/services/public-promotions-service";

const SEEN_KEY = "all4horeca-stories-seen";

/**
 * Pagina restaurantului în varianta „Stories” (aleasă de Claudiu, 21.11.2026).
 * Primește exact aceleași date ca pagina clasică și folosește același coș.
 */
export function StoriesRestaurantPage({
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
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const { addItem, items } = useCart();
  const { settings, restaurantOpen, restaurantStatus, ordersPaused } = useRestaurantSettings();
  const accent = restaurant.primaryColor || "#173A2E";
  const canOrder = !ordersPaused && !restaurant.accessLocked;

  const products = useMemo(
    () => initialProducts.filter((product) => product.active !== false && !product.soldOut),
    [initialProducts],
  );
  const categories = useMemo(
    () => initialCategories.filter((category) => category.active !== false),
    [initialCategories],
  );
  const [query, setQuery] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    categories.some((category) => category.id === initialCategory) ? initialCategory : categories[0]?.id ?? "",
  );
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const scrollingTo = useRef(false);

  useEffect(() => {
    let active = true;
    void getActivePromotions(restaurant.id)
      .then((list) => active && setPromotions(list))
      .catch(() => active && setPromotions([]));
    return () => {
      active = false;
    };
  }, [restaurant.id]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]");
      // Citire din localStorage după hidratare (serverul nu știe ce povești au fost văzute).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(saved)) setSeen(saved.filter((item) => typeof item === "string"));
    } catch {
      /* fără istoric de povești văzute */
    }
  }, []);

  const markSeen = useCallback((storyId: string) => {
    setSeen((current) => {
      if (current.includes(storyId)) return current;
      const next = [...current, storyId].slice(-60);
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const featured = useMemo(() => {
    const list = products.filter((product) => product.featured);
    return (list.length ? list : products).slice(0, 5);
  }, [products]);
  const bestsellers = useMemo(() => products.filter((product) => product.bestseller).slice(0, 8), [products]);
  const newProducts = useMemo(() => products.filter((product) => product.isNew), [products]);

  const stories = useMemo<Story[]>(() => {
    const list: Story[] = [];
    if (newProducts.length) {
      list.push({
        id: `new-${newProducts.map((p) => p.id).join("-")}`,
        label: "Noutăți",
        image: newProducts[0].image,
        slides: newProducts.slice(0, 6).map((product) => ({
          key: product.id,
          kicker: "Nou în meniu",
          title: product.name,
          text: product.shortDescription,
          image: product.image,
          product,
        })),
      });
    }
    for (const promotion of promotions) {
      const promoProducts = promotion.productIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product));
      list.push({
        id: `promo-${promotion.id}`,
        label: promotion.discountPercent ? `−${promotion.discountPercent}%` : "Ofertă",
        badge: "Ofertă",
        image: promoProducts[0]?.image ?? null,
        slides: [
          {
            key: promotion.id,
            kicker: promotion.discountPercent ? `Reducere ${promotion.discountPercent}%` : "Ofertă",
            title: promotion.name,
            text:
              promotion.description ||
              (promotion.type === "happy_hour" && promotion.startsAt ?
                `În fiecare zi, ${promotion.startsAt}–${promotion.endsAt}.`
              : "Reducerea se aplică automat în coș."),
            image: promoProducts[0]?.image ?? null,
            product: promoProducts[0],
          },
        ],
      });
    }
    if (featured.length && featured.some((product) => product.featured)) {
      list.push({
        id: `top-${featured.map((p) => p.id).join("-")}`,
        label: "Recomandate",
        image: featured[0].image,
        slides: featured.map((product) => ({
          key: product.id,
          kicker: "Recomandarea casei",
          title: product.name,
          text: product.shortDescription,
          image: product.image,
          product,
        })),
      });
    }
    for (const category of categories) {
      const inCategory = products.filter((product) => product.categoryId === category.id);
      if (!inCategory.length) continue;
      list.push({
        id: `cat-${category.id}-${inCategory.length}`,
        label: category.name,
        image: inCategory[0].image,
        slides: inCategory.slice(0, 5).map((product) => ({
          key: product.id,
          kicker: category.name,
          title: product.name,
          text: product.shortDescription,
          image: product.image,
          product,
        })),
      });
    }
    return list;
  }, [categories, featured, newProducts, products, promotions]);

  const normalizedQuery = query.trim().toLocaleLowerCase("ro-RO");
  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (onlyNew && !product.isNew) return false;
        if (!normalizedQuery) return true;
        return `${product.name} ${product.shortDescription} ${product.ingredients ?? ""}`
          .toLocaleLowerCase("ro-RO")
          .includes(normalizedQuery);
      }),
    [normalizedQuery, onlyNew, products],
  );
  const sections = useMemo(() => {
    const known = new Set(categories.map((category) => category.id));
    const list = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        products: filtered
          .filter((product) => product.categoryId === category.id)
          .sort((a, b) => Number(b.featured) - Number(a.featured)),
      }))
      .filter((section) => section.products.length);
    const orphans = filtered.filter((product) => !known.has(product.categoryId));
    if (orphans.length) list.push({ id: "altele", name: "Altele", products: orphans });
    return list;
  }, [categories, filtered]);

  // Bara de categorii urmărește secțiunea vizibilă.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingTo.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveCategory(visible.target.getAttribute("data-category") ?? "");
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    document.querySelectorAll("[data-category]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const pill = pillsRef.current?.querySelector<HTMLElement>(`[data-pill="${activeCategory}"]`);
    pill?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeCategory]);

  // Link vechi cu ?category=… : derulăm direct la secțiune.
  useEffect(() => {
    if (!initialCategory || initialCategory === "all") return;
    const node = document.getElementById(`sectiune-${initialCategory}`);
    if (node) window.setTimeout(() => node.scrollIntoView({ behavior: "auto" }), 50);
  }, [initialCategory]);

  const goToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const node = document.getElementById(`sectiune-${categoryId}`);
    if (!node) return;
    scrollingTo.current = true;
    const top = node.getBoundingClientRect().top + window.scrollY - 118;
    window.scrollTo({ top, behavior: "smooth" });
    window.setTimeout(() => {
      scrollingTo.current = false;
    }, 700);
    const url = new URL(window.location.href);
    url.searchParams.set("category", categoryId);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  };

  const quickAdd = (product: Product, source: Element | null) => {
    if (!canOrder || needsRequiredChoice(product)) {
      setOpenProduct(product);
      return;
    }
    addItem(product);
    flyToCart(source);
    setJustAdded(product.id);
    window.setTimeout(() => setJustAdded((value) => (value === product.id ? null : value)), 1400);
  };

  const quantityInCart = (productId: string) =>
    items.filter((item) => item.product.id === productId).reduce((sum, item) => sum + item.quantity, 0);

  const statusLabel = ordersPaused ?
      "Nu primește comenzi momentan"
    : restaurantOpen ? "Deschis"
    : restaurantStatus.label;
  const callHref = toTelHref(restaurant.phone);
  const mapsUrl = restaurant.address ?
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.address}`)}`
    : null;

  return (
    <main className="min-h-screen bg-white pb-44">
      {currentRestaurant?.status === "trial" && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-black text-amber-900">
          Restaurant în mod test. Comenzile reale nu sunt active încă.
        </div>
      )}

      <div className="mx-auto max-w-xl">
        {restaurant.coverImageUrl && (
          <div className="relative h-28 overflow-hidden">
            <SafeImage src={restaurant.coverImageUrl} alt="" fallbackLabel={restaurant.name} fill priority className="object-cover" sizes="(max-width: 640px) 100vw, 576px" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
          </div>
        )}

        <header className="flex items-center gap-3 px-5 pt-4">
          <div
            className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[14px] text-sm font-black text-white"
            style={{ backgroundColor: accent }}
          >
            {restaurant.logoUrl ?
              <SafeImage src={restaurant.logoUrl} alt="" fallbackLabel={restaurant.name} fill className="object-cover" />
            : restaurant.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[19px] font-semibold leading-tight text-[#14161C]">{restaurant.name}</h1>
            <p className={`flex items-center gap-1.5 text-xs font-bold ${restaurantOpen && !ordersPaused ? "text-[#173A2E]" : "text-red-700"}`}>
              <span className={`size-[7px] rounded-full ${restaurantOpen && !ordersPaused ? "stories-pulse bg-[#3BA55C]" : "bg-red-600"}`} />
              {statusLabel}
              {settings.estimatedDeliveryTime && restaurantOpen && !ordersPaused ? ` · ${settings.estimatedDeliveryTime}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Caută în meniu"
            onClick={() => {
              document.getElementById("stories-search")?.focus();
            }}
            className="grid size-10 place-items-center rounded-[13px] bg-[#F1EEE7]"
          >
            <SearchIcon className="size-[19px]" />
          </button>
          {callHref && (
            <a href={callHref} aria-label="Sună restaurantul" className="grid size-10 place-items-center rounded-[13px] bg-[#F1EEE7]">
              <PhoneIcon className="size-[18px]" />
            </a>
          )}
        </header>

        {ordersPaused && (
          <div role="status" className="mx-5 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
            Restaurantul nu primește comenzi momentan. Te rugăm să revii puțin mai târziu.
          </div>
        )}

        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 text-xs font-bold">
          {settings.acceptsDelivery && (
            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#F1EEE7] px-3 text-[#173A2E]">
              <TruckIcon className="size-4" />
              Livrare{settings.deliveryFee > 0 ? ` ${formatPrice(settings.deliveryFee)}` : " gratuită"}
            </span>
          )}
          {settings.freeDeliveryThreshold > 0 && settings.acceptsDelivery && (
            <span className="inline-flex h-9 shrink-0 items-center rounded-xl bg-[#FFF3D6] px-3 text-[#7A5620]">
              Gratuită peste {formatPrice(settings.freeDeliveryThreshold)}
            </span>
          )}
          {settings.acceptsPickup && (
            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#F1EEE7] px-3 text-[#173A2E]">
              <WalkIcon className="size-4" />
              Ridicare personală
            </span>
          )}
          {!user && (
            <a href="/checkout" className="inline-flex h-9 shrink-0 items-center rounded-xl px-3 text-white" style={{ backgroundColor: accent }}>
              Intră cu telefonul
            </a>
          )}
        </div>

        {stories.length > 0 && (
          <section aria-label="Povești" className="hide-scrollbar mt-4 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {stories.map((story, index) => {
              const isSeen = seen.includes(story.id);
              return (
                <button key={story.id} type="button" onClick={() => setStoryIndex(index)} className="w-[68px] shrink-0 text-center">
                  <span
                    className={`block size-[68px] rounded-full p-[3px] ${isSeen ? "bg-[#E2DDD2]" : "stories-ring"}`}
                    style={isSeen ? undefined : { ["--stories-accent" as string]: accent }}
                  >
                    <span className="relative block size-full overflow-hidden rounded-full border-[3px] border-white bg-[#FBF7EF]">
                      {story.image ?
                        <SafeImage src={story.image} alt="" fallbackLabel={story.label} fill className="object-cover" sizes="68px" />
                      : <span className="grid size-full place-items-center text-sm font-black" style={{ color: accent }}>{story.label.slice(0, 4)}</span>}
                    </span>
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] font-bold text-[#14161C]">{story.label}</span>
                </button>
              );
            })}
          </section>
        )}

        {featured.length > 0 && <HeroCarousel products={featured} accent={accent} onOpen={setOpenProduct} />}

        {bestsellers.length > 0 && (
          <section className="mt-6" aria-label="Cele mai comandate">
            <div className="flex items-baseline justify-between px-5">
              <h2 className="text-[21px] font-semibold">Cele mai comandate</h2>
            </div>
            <div className="hide-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {bestsellers.map((product, index) => (
                <article key={product.id} className="stories-rise relative w-[150px] shrink-0 rounded-[22px] bg-[#FBF7EF] p-2.5" style={{ animationDelay: `${index * 60}ms` }}>
                  <span className="absolute left-3 top-2 z-10 text-[22px] font-semibold text-[#B88A44]" style={{ fontFamily: "var(--font-fraunces)" }}>
                    #{index + 1}
                  </span>
                  <button type="button" onClick={() => setOpenProduct(product)} className="block w-full text-left">
                    <span data-fly className="relative mt-1 block h-24 overflow-hidden rounded-2xl">
                      <SafeImage src={product.image} alt="" fallbackLabel={product.name} fill className="object-cover" sizes="150px" />
                    </span>
                    <span className="mt-2 line-clamp-1 block text-[13.5px] font-bold">{product.name}</span>
                  </button>
                  <div className="mt-1.5 flex items-center justify-between">
                    <b className="text-[15px]" style={{ color: accent }}>{formatPrice(product.price)}</b>
                    <AddButton
                      accent={accent}
                      added={justAdded === product.id}
                      count={quantityInCart(product.id)}
                      label={product.name}
                      small
                      onClick={(event) => quickAdd(product, event.currentTarget.closest("article")?.querySelector("[data-fly]") ?? null)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="sticky top-0 z-30 mt-6 bg-white/95 pb-2 pt-3 shadow-[0_10px_16px_-14px_rgba(0,0,0,.35)] backdrop-blur">
          <div className="flex items-center gap-2 px-5">
            <label className="flex h-11 flex-1 items-center gap-2 rounded-[14px] bg-[#F1EEE7] px-3.5 text-[#6E6A62]">
              <SearchIcon className="size-[17px] shrink-0" />
              <input
                id="stories-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Caută în meniu…"
                className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#14161C] outline-none placeholder:text-[#8A857B]"
              />
            </label>
            {newProducts.length > 0 && (
              <button
                type="button"
                aria-pressed={onlyNew}
                onClick={() => setOnlyNew((value) => !value)}
                className="h-11 shrink-0 rounded-[14px] border-[1.5px] px-3.5 text-[13px] font-bold"
                style={onlyNew ? { borderColor: accent, color: accent, backgroundColor: "#EAF1EC" } : { borderColor: "#E2DDD2" }}
              >
                Nou
              </button>
            )}
          </div>
          {sections.length > 1 && (
            <nav ref={pillsRef} aria-label="Categorii" className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto px-5">
              {sections.map((section) => {
                const active = section.id === activeCategory;
                return (
                  <button
                    key={section.id}
                    data-pill={section.id}
                    type="button"
                    onClick={() => goToCategory(section.id)}
                    aria-pressed={active}
                    className="h-9 shrink-0 rounded-full px-4 text-[13px] font-bold transition-colors"
                    style={active ? { backgroundColor: accent, color: "#fff" } : { backgroundColor: "#F1EEE7", color: "#14161C" }}
                  >
                    {section.name}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        <div className="px-5">
          {sections.map((section) => (
            <section key={section.id} id={`sectiune-${section.id}`} data-category={section.id} className="scroll-mt-32 pt-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold">{section.name}</h2>
                <span className="text-[13px] font-bold text-[#8A857B]">
                  {section.products.length} {section.products.length === 1 ? "produs" : "produse"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {section.products.map((product) => (
                  <article key={product.id} className="relative flex flex-col rounded-[22px] bg-[#FBF7EF] p-2.5">
                    <button type="button" onClick={() => setOpenProduct(product)} className="block text-left" aria-label={`Detalii ${product.name}`}>
                      <span data-fly className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#F1EEE7]">
                        <SafeImage src={product.image} alt="" fallbackLabel={product.name} fill className="object-cover transition-transform duration-500 hover:scale-105" sizes="(max-width: 640px) 45vw, 270px" />
                        {(product.bestseller || product.isNew) && (
                          <span className="absolute left-2 top-2 rounded-lg bg-[#B88A44] px-2 py-1 text-[10px] font-black text-white">
                            {product.bestseller ? "Cel mai comandat" : "Nou"}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 line-clamp-2 block px-0.5 text-[14px] font-bold leading-tight">{product.name}</span>
                      {product.shortDescription && (
                        <span className="mt-1 line-clamp-2 block px-0.5 text-[11px] leading-[1.3] text-[#6E6A62]">{product.shortDescription}</span>
                      )}
                    </button>
                    <div className="mt-auto flex items-center justify-between px-0.5 pt-2">
                      <b className="text-[16px]" style={{ color: accent }}>{formatPrice(product.price)}</b>
                      <AddButton
                        accent={accent}
                        added={justAdded === product.id}
                        count={quantityInCart(product.id)}
                        label={product.name}
                        onClick={(event) => quickAdd(product, event.currentTarget.closest("article")?.querySelector("[data-fly]") ?? null)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {initialCatalogError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Catalogul nu a putut fi încărcat: {initialCatalogError}
            </div>
          )}
          {!sections.length && !initialCatalogError && (
            <p className="py-16 text-center text-sm font-bold text-[#6E6A62]">
              {normalizedQuery || onlyNew ? "Niciun produs nu se potrivește căutării." : "Nu sunt produse disponibile momentan."}
            </p>
          )}
        </div>

        {(restaurant.address || restaurant.phone || restaurant.facebookUrl || restaurant.instagramUrl) && (
          <section aria-label="Contact restaurant" className="mx-5 mt-10 rounded-[22px] bg-[#FBF7EF] p-5 text-sm text-[#34433C]">
            <h2 className="text-lg font-semibold text-[#14161C]">{restaurant.name}</h2>
            {restaurant.address && (
              <p className="mt-2">
                {mapsUrl ?
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">{restaurant.address}</a>
                : restaurant.address}
              </p>
            )}
            {restaurant.phone && (
              <p className="mt-1">
                Telefon:{" "}
                <a href={callHref ?? "#"} className="font-black" style={{ color: accent }}>{restaurant.phone}</a>
              </p>
            )}
            {(restaurant.facebookUrl || restaurant.instagramUrl) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {restaurant.facebookUrl && (
                  <a href={restaurant.facebookUrl} target="_blank" rel="noopener noreferrer" className="grid min-h-11 place-items-center rounded-xl bg-white px-4 text-xs font-black">Facebook</a>
                )}
                {restaurant.instagramUrl && (
                  <a href={restaurant.instagramUrl} target="_blank" rel="noopener noreferrer" className="grid min-h-11 place-items-center rounded-xl bg-white px-4 text-xs font-black">Instagram</a>
                )}
              </div>
            )}
          </section>
        )}
        <footer className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 px-5 text-xs font-bold text-[#6E6A62]">
          <a href={`/clienti/${restaurant.slug}/termeni`} className="underline">Termeni</a>
          <a href={`/clienti/${restaurant.slug}/confidentialitate`} className="underline">Confidențialitate</a>
          <a href={`/clienti/${restaurant.slug}/cookie-uri`} className="underline">Cookie-uri</a>
        </footer>
      </div>

      {openProduct && (
        <ProductSheet
          key={openProduct.id}
          product={openProduct}
          allProducts={products}
          accent={accent}
          canOrder={canOrder}
          onClose={() => setOpenProduct(null)}
          onOpenProduct={(product) => setOpenProduct(product)}
        />
      )}
      {storyIndex !== null && (
        <StoryViewer
          stories={stories}
          startIndex={storyIndex}
          accent={accent}
          onClose={() => setStoryIndex(null)}
          onSeen={markSeen}
          onOpenProduct={(product) => setOpenProduct(product)}
        />
      )}
    </main>
  );
}

function AddButton({
  accent,
  added,
  count,
  label,
  small,
  onClick,
}: {
  accent: string;
  added: boolean;
  count: number;
  label: string;
  small?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const size = small ? "h-[30px] min-w-[30px] rounded-[10px]" : "h-[34px] min-w-[34px] rounded-xl";
  if (count > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Adaugă încă un ${label} (în coș: ${count})`}
        className={`${size} ${added ? "stories-pop" : ""} inline-flex items-center justify-center gap-1 bg-[#E3B33C] px-2.5 text-[13px] font-black text-[#0E1F19]`}
      >
        <CheckIcon className="size-3.5" />
        {count}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Adaugă ${label}`}
      className={`${size} grid place-items-center text-white transition active:scale-90`}
      style={{ backgroundColor: accent }}
    >
      <PlusIcon className={small ? "size-4" : "size-[18px]"} strokeWidth={2.6} />
    </button>
  );
}

function HeroCarousel({
  products,
  accent,
  onOpen,
}: {
  products: Product[];
  accent: string;
  onOpen: (product: Product) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const touching = useRef(false);

  useEffect(() => {
    if (products.length < 2) return;
    const timer = window.setInterval(() => {
      if (touching.current) return;
      const track = trackRef.current;
      if (!track) return;
      const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % products.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [products.length]);

  return (
    <section aria-label="Recomandările zilei" className="mt-5 px-5">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
        }}
        onPointerDown={() => (touching.current = true)}
        onPointerUp={() => (touching.current = false)}
        onTouchStart={() => (touching.current = true)}
        onTouchEnd={() => (touching.current = false)}
        className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[26px]"
      >
        {products.map((product, position) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onOpen(product)}
            className="relative h-[196px] w-full shrink-0 snap-center overflow-hidden text-left text-white"
            style={{ backgroundColor: accent }}
          >
            <SafeImage src={product.image} alt="" fallbackLabel={product.name} fill priority={position === 0} className="object-cover opacity-90" sizes="(max-width: 640px) 100vw, 540px" />
            <span className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}e6 38%, transparent 78%)` }} />
            <span className="relative block p-[22px]">
              <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#E3B33C]">
                {product.featured ? "Recomandarea casei" : "Din meniu"}
              </span>
              <span className="mt-2 line-clamp-2 block w-[62%] text-[26px] font-semibold leading-[1.1]" style={{ fontFamily: "var(--font-fraunces)" }}>
                {product.name}
              </span>
              <span className="mt-2 block text-[22px] font-black">{formatPrice(product.price)}</span>
            </span>
            <span className="absolute bottom-[18px] left-[22px] inline-flex h-[34px] items-center gap-1.5 rounded-xl bg-white px-3.5 text-[13px] font-black" style={{ color: accent }}>
              Vreau asta <ChevronRightIcon className="size-3.5" />
            </span>
          </button>
        ))}
      </div>
      {products.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {products.map((product, position) => (
            <span
              key={product.id}
              className="h-[5px] rounded-full transition-all duration-300"
              style={{ width: position === index ? 18 : 5, backgroundColor: position === index ? accent : "#D9CFBC" }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
