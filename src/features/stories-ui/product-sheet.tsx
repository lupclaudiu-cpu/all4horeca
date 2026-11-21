"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ClockIcon, CloseIcon, MinusIcon, PlusIcon } from "@/features/stories-ui/stories-icons";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { calculateCartItemTotal } from "@/lib/cart-pricing";
import {
  buildSelectedOptions,
  changeOptionQuantity,
  findMissingRequiredGroup,
  selectSingleOption,
  type SelectionState,
} from "@/lib/product-selection";
import type { Product } from "@/lib/types";
import { flyToCart } from "@/features/stories-ui/fly-to-cart";

/**
 * Detaliul produsului ca foaie care urcă de jos, peste meniu.
 * Regulile (opțiuni obligatorii, prețuri, coș) sunt aceleași ca pe pagina clasică a produsului.
 */
export function ProductSheet({
  product,
  allProducts,
  accent,
  canOrder,
  onClose,
  onOpenProduct,
}: {
  product: Product;
  allProducts: Product[];
  accent: string;
  canOrder: boolean;
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<SelectionState>({});
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const selectedOptions = useMemo(
    () => buildSelectedOptions(product, selected),
    [product, selected],
  );
  const lineTotal = calculateCartItemTotal({
    lineId: "preview",
    product,
    quantity,
    unitPrice: product.price,
    selectedOptions,
  });
  const recommendations = (product.recommendationIds ?? [])
    .map((id) => allProducts.find((item) => item.id === id))
    .filter((item): item is Product => Boolean(item && item.active !== false && !item.soldOut));

  const close = () => {
    setClosing(true);
    window.setTimeout(onClose, 220);
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    const missing = findMissingRequiredGroup(product, selected);
    if (missing) {
      setError(`Alege o variantă pentru „${missing.name}”.`);
      document
        .getElementById(`stories-group-${missing.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem(product, quantity, selectedOptions);
    flyToCart(imageRef.current);
    close();
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={product.name}>
      <button
        type="button"
        aria-label="Închide"
        onClick={close}
        className={`absolute inset-0 bg-[#0E1F19]/55 ${closing ? "stories-fade-out" : "stories-fade-in"}`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-xl flex-col overflow-hidden rounded-t-[30px] bg-white shadow-2xl ${closing ? "stories-sheet-out" : "stories-sheet-in"}`}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
      >
        <div
          className="shrink-0 touch-none pb-1 pt-2.5"
          onPointerDown={(event) => {
            dragStart.current = event.clientY;
            (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (dragStart.current === null) return;
            setDragY(Math.max(0, event.clientY - dragStart.current));
          }}
          onPointerUp={() => {
            const shouldClose = dragY > 110;
            dragStart.current = null;
            setDragY(0);
            if (shouldClose) close();
          }}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-[#DDD6C8]" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <div
            ref={imageRef}
            className="relative h-56 overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_50%_60%,#F6E7C8,#FBF7EF_70%)]"
          >
            <SafeImage
              src={product.image}
              alt={product.name}
              fallbackLabel={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 560px"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Închide"
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 shadow"
            >
              <CloseIcon className="size-5" />
            </button>
            <div className="absolute left-3 top-3 flex gap-1.5">
              {product.bestseller && <Badge text="Cel mai comandat" />}
              {product.isNew && <Badge text="Nou" />}
            </div>
          </div>

          <div className="mt-4 flex items-start justify-between gap-4 px-1">
            <h2 className="text-[26px] font-semibold leading-[1.1] text-[#14161C]">{product.name}</h2>
            <strong className="shrink-0 text-xl" style={{ color: accent }}>
              {formatPrice(product.price)}
            </strong>
          </div>
          {(product.description || product.shortDescription) && (
            <p className="mt-2 px-1 text-sm leading-6 text-[#6E6A62]">
              {product.description || product.shortDescription}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 px-1 text-xs font-bold text-[#6E6A62]">
            {product.prepTime && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EEE7] px-3 py-1.5">
                <ClockIcon className="size-3.5" />
                {product.prepTime}
              </span>
            )}
            {product.weight && <span className="rounded-full bg-[#F1EEE7] px-3 py-1.5">{product.weight}</span>}
          </div>
          {product.allergens && (
            <p className="mt-2 px-1 text-[11px] text-[#8A857B]">Alergeni: {product.allergens}</p>
          )}

          {(product.optionGroups ?? []).map((group) => (
            <section key={group.id} id={`stories-group-${group.id}`} className="mt-6 px-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-black uppercase tracking-[0.08em] text-[#6E6A62]">
                  {group.name}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                    group.required ? "bg-[#FFF3D6] text-[#7A5620]" : "bg-[#F1EEE7] text-[#6E6A62]"
                  }`}
                >
                  {group.required ? "Obligatoriu" : "Opțional"}
                </span>
              </div>
              {group.selectionType === "single" ? (
                <div className="mt-2 divide-y divide-[#EEE9DF]">
                  {group.options.map((option) => {
                    const checked = (selected[group.id]?.[option.id] ?? 0) > 0;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setError("");
                          setSelected((current) => selectSingleOption(current, group.id, option.id));
                        }}
                        aria-pressed={checked}
                        className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-sm font-bold"
                      >
                        <span>
                          {option.name}
                          {option.priceDelta ? (
                            <span className="ml-2 text-xs text-[#B88A44]">+{formatPrice(option.priceDelta)}</span>
                          ) : null}
                        </span>
                        <span
                          className="size-[22px] shrink-0 rounded-full border-2 border-[#CFC8BA] transition-all"
                          style={checked ? { borderColor: accent, borderWidth: 7 } : undefined}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const count = selected[group.id]?.[option.id] ?? 0;
                    const label = `${option.name}${option.priceDelta ? ` +${formatPrice(option.priceDelta)}` : ""}`;
                    if (count === 0) {
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setError("");
                            setSelected((current) => changeOptionQuantity(current, group.id, option.id, 1));
                          }}
                          className="min-h-10 rounded-xl border-[1.5px] border-[#E2DDD2] px-3 text-[13px] font-bold"
                        >
                          {label}
                        </button>
                      );
                    }
                    return (
                      <span
                        key={option.id}
                        className="stories-pop inline-flex min-h-10 items-center gap-1 rounded-xl border-[1.5px] bg-[#EAF1EC] pl-1 pr-3 text-[13px] font-bold"
                        style={{ borderColor: accent, color: accent }}
                      >
                        <button
                          type="button"
                          aria-label={`Scade ${option.name}`}
                          onClick={() => setSelected((current) => changeOptionQuantity(current, group.id, option.id, -1))}
                          className="grid size-8 place-items-center"
                        >
                          {count === 1 ? <CheckIcon className="size-4" /> : <MinusIcon className="size-4" />}
                        </button>
                        {count > 1 && <b>{count}×</b>}
                        {label}
                        <button
                          type="button"
                          aria-label={`Adaugă încă ${option.name}`}
                          onClick={() => setSelected((current) => changeOptionQuantity(current, group.id, option.id, 1))}
                          className="ml-1 grid size-7 place-items-center rounded-lg bg-white"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {error && (
            <p role="alert" className="mx-1 mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {error}
            </p>
          )}

          {recommendations.length > 0 && (
            <section className="mt-7 px-1">
              <h3 className="text-lg font-semibold">Merge perfect cu</h3>
              <div className="hide-scrollbar -mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1">
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenProduct(item)}
                    className="w-32 shrink-0 rounded-2xl border-[1.5px] border-[#EEE9DF] p-2 text-left"
                  >
                    <div className="relative h-20 overflow-hidden rounded-xl bg-[#FBF7EF]">
                      <SafeImage src={item.image} alt="" fallbackLabel={item.name} fill className="object-cover" sizes="128px" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-bold">{item.name}</p>
                    <p className="mt-1 text-xs font-black" style={{ color: accent }}>{formatPrice(item.price)}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="safe-bottom flex shrink-0 items-center gap-3 border-t border-[#EEE9DF] bg-white px-4 pt-3">
          <div className="flex h-12 items-center gap-2 rounded-2xl bg-[#F1EEE7] px-1.5">
            <button
              type="button"
              aria-label="Scade cantitatea"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid size-9 place-items-center rounded-xl bg-white"
            >
              <MinusIcon className="size-4" />
            </button>
            <b className="min-w-5 text-center">{quantity}</b>
            <button
              type="button"
              aria-label="Crește cantitatea"
              onClick={() => setQuantity((value) => value + 1)}
              className="grid size-9 place-items-center rounded-xl bg-white"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canOrder}
            className="flex h-14 flex-1 items-center justify-between rounded-[18px] px-5 text-base font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            <span>{canOrder ? "Adaugă" : "Indisponibil acum"}</span>
            <span key={lineTotal} className="stories-pop">{formatPrice(lineTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-lg bg-[#B88A44] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
      {text}
    </span>
  );
}
