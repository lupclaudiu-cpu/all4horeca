"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, ClockIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useCatalog } from "@/features/catalog/catalog-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { calculateCartItemTotal } from "@/lib/cart-pricing";
import type { Product, SelectedProductOption } from "@/lib/types";

type SelectionState = Record<string, Record<string, number>>;

export function ProductDetail({
  productId,
  returnTo,
  initialProduct,
  initialProducts = [],
  initialCatalogError = null,
}: {
  productId: string;
  returnTo?: string;
  initialProduct?: Product | null;
  initialProducts?: Product[];
  initialCatalogError?: string | null;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<SelectionState>({});
  const [selectionError, setSelectionError] = useState("");
  const { products, loading, error, refresh } = useCatalog();
  const { addItem, openCart } = useCart();
  const { currentRestaurant } = useRestaurant();
  const menuUrl = currentRestaurant ? `/clienti/${currentRestaurant.slug}` : "/";
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : menuUrl;
  const directProduct =
    initialProduct?.active !== false && !initialProduct?.soldOut
      ? initialProduct
      : initialProducts.find(
          (item) => item.id === productId && item.active !== false && !item.soldOut,
        );
  const contextProduct = products.find(
    (item) => item.id === productId && item.active !== false && !item.soldOut,
  );
  const product = directProduct ?? contextProduct;
  const catalogProducts = initialProducts.length > 0 ? initialProducts : products;

  const selectedOptions = useMemo<SelectedProductOption[]>(
    () =>
      (product?.optionGroups ?? []).flatMap((group) =>
        group.options.flatMap((option) => {
          const optionQuantity = selected[group.id]?.[option.id] ?? 0;
          return optionQuantity > 0
            ? [
                {
                  groupId: group.id,
                  groupName: group.name,
                  optionId: option.id,
                  optionName: option.name,
                  priceDelta: option.priceDelta,
                  quantity: optionQuantity,
                  multiplyByProductQuantity: option.multiplyByProductQuantity,
                },
              ]
            : [];
        }),
      ),
    [product, selected],
  );

  if (!product && loading) {
    return (
      <main className="min-h-screen animate-pulse bg-slate-50">
        <div className="mx-auto aspect-[16/10] max-h-[420px] max-w-4xl bg-gradient-to-br from-blue-50 via-white to-cyan-50" />
        <div className="mx-auto -mt-5 h-96 max-w-3xl rounded-[2rem] bg-white shadow-xl" />
      </main>
    );
  }

  if (error || initialCatalogError || !product) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl">
          <h1 className="text-2xl font-black">Produs indisponibil</h1>
          <p className="mt-2 text-sm text-slate-500">
            {error || initialCatalogError || "Produsul nu mai există în catalog."}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Reîncearcă
          </button>
        </div>
      </main>
    );
  }

  const lineTotal = calculateCartItemTotal({
    lineId: "preview",
    product,
    quantity,
    unitPrice: product.price,
    selectedOptions,
  });
  const recommendations =
    product.recommendationIds
      ?.map((id) => catalogProducts.find((item) => item.id === id))
      .filter(
        (item): item is Product =>
          Boolean(item && item.active !== false && !item.soldOut),
      ) ?? [];

  const selectSingle = (groupId: string, optionId: string) => {
    setSelectionError("");
    setSelected((current) => ({
      ...current,
      [groupId]: { [optionId]: 1 },
    }));
  };

  const changeOptionQuantity = (
    groupId: string,
    optionId: string,
    delta: number,
  ) => {
    setSelectionError("");
    setSelected((current) => {
      const group = current[groupId] ?? {};
      const nextQuantity = Math.max(0, (group[optionId] ?? 0) + delta);
      const nextGroup = { ...group };
      if (nextQuantity === 0) delete nextGroup[optionId];
      else nextGroup[optionId] = nextQuantity;
      return { ...current, [groupId]: nextGroup };
    });
  };

  const handleAdd = () => {
    const missing = (product.optionGroups ?? []).find(
      (group) =>
        group.required &&
        !Object.values(selected[group.id] ?? {}).some((value) => value > 0),
    );
    if (missing) {
      setSelectionError(`Selectează o opțiune pentru ${missing.name}.`);
      return;
    }
    addItem(product, quantity, selectedOptions);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(safeReturnTo);
  };

  const addRecommendation = (item: Product) => {
    const hasRequiredOptions = (item.optionGroups ?? []).some(
      (group) => group.active && group.required,
    );
    if (hasRequiredOptions) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      router.push(`/produs/${item.id}?from=${encodeURIComponent(currentPath)}`);
      return;
    }
    addItem(item);
    openCart();
  };

  return (
    <main className="page-enter min-h-screen bg-slate-50 pb-40">
      <div className="mx-auto max-w-4xl">
        <div className="relative mx-auto aspect-[4/3] max-h-[360px] overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 sm:aspect-[16/10] sm:max-h-[420px] sm:rounded-b-[2.5rem]">
          <SafeImage
            src={product.image}
            alt={product.name}
            fallbackLabel={product.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 900px"
          />
          <button
            type="button"
            onClick={goBack}
            aria-label="Înapoi la categoria anterioară"
            className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-white/95 shadow-lg backdrop-blur"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
        </div>

        <section className="antoria-card relative -mt-5 rounded-t-[2rem] px-5 pb-8 pt-6 sm:-mt-10 sm:mx-8 sm:rounded-[2.25rem] sm:px-8">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600">
                Selecție din meniu
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                {product.name}
              </h1>
            </div>
            <span className="shrink-0 text-xl font-black text-blue-700 sm:text-2xl">
              {formatPrice(product.price)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            {product.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800">
              <ClockIcon className="size-4 text-cyan-600" />
              {product.prepTime}
            </div>
            {product.featured && (
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                Recomandat de restaurant
              </span>
            )}
          </div>

          {(product.optionGroups ?? []).map((group) => (
            <div key={group.id} className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black">{group.name}</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {group.selectionType === "single"
                      ? "Alege o variantă"
                      : "Alege suplimentele și cantitatea"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500">
                  {group.required ? "Obligatoriu" : "Opțional"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {group.options.map((option) => {
                  const optionQuantity = selected[group.id]?.[option.id] ?? 0;
                  const checked = optionQuantity > 0;
                  return (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        checked
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {group.selectionType === "single" ? (
                        <button
                          type="button"
                          onClick={() => selectSingle(group.id, option.id)}
                          className={`size-5 rounded-full border-2 p-1 ${
                            checked ? "border-blue-500" : "border-slate-400"
                          }`}
                          aria-label={`Selectează ${option.name}`}
                        >
                          {checked && (
                            <span className="block size-full rounded-full bg-blue-600" />
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center rounded-full bg-slate-200 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              changeOptionQuantity(group.id, option.id, -1)
                            }
                            disabled={!checked}
                            className="grid size-7 place-items-center rounded-full bg-white disabled:opacity-35"
                            aria-label={`Scade ${option.name}`}
                          >
                            <MinusIcon className="size-3.5" />
                          </button>
                          <span className="min-w-7 text-center text-xs font-black">
                            {optionQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              changeOptionQuantity(group.id, option.id, 1)
                            }
                            className="grid size-7 place-items-center rounded-full bg-white"
                            aria-label={`Adaugă ${option.name}`}
                          >
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          group.selectionType === "single"
                            ? selectSingle(group.id, option.id)
                            : changeOptionQuantity(group.id, option.id, 1)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block text-sm font-black">
                          {option.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {option.priceDelta
                            ? `+${formatPrice(option.priceDelta)}`
                            : "Inclus"}
                          {option.multiplyByProductQuantity
                            ? " pentru fiecare produs"
                            : ""}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {selectionError && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {selectionError}
            </p>
          )}

          {recommendations.length > 0 && (
            <div className="mt-8 rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">
                Se comandă frecvent împreună
              </p>
              <h2 className="mt-1 text-xl font-black">Completează meniul</h2>
              <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-2">
                {recommendations.map((item) => (
                  <article
                    key={item.id}
                    className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-sm"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                      <SafeImage
                        src={item.image}
                        alt=""
                        fallbackLabel={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-blue-700">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addRecommendation(item)}
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20"
                      aria-label={`Adaugă ${item.name}`}
                    >
                      <PlusIcon className="size-4" />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-[73px] z-30 border-t border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_-14px_40px_rgba(15,23,42,.08)] backdrop-blur-2xl md:left-1/2 md:max-w-4xl md:-translate-x-1/2">
        <div className="mx-auto flex max-w-3xl gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-2">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid size-10 place-items-center"
              aria-label="Scade cantitatea produsului"
            >
              <MinusIcon className="size-5" />
            </button>
            <span className="min-w-5 text-center font-black">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="grid size-10 place-items-center"
              aria-label="Crește cantitatea produsului"
            >
              <PlusIcon className="size-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={added ? openCart : handleAdd}
            className="antoria-focus flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition hover:brightness-105 active:scale-[0.98]"
          >
            {added ? "Adăugat · Vezi coșul" : `Adaugă · ${formatPrice(lineTotal)}`}
          </button>
        </div>
      </div>
    </main>
  );
}
