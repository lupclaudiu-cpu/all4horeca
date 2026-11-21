"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useOrderDiscount } from "@/features/cart/use-order-discount";
import { useCatalog } from "@/features/catalog/catalog-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { calculateCartItemTotal } from "@/lib/cart-pricing";
import { needsRequiredChoice } from "@/lib/product-selection";
import type { CartItem, Product } from "@/lib/types";
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "@/features/stories-ui/stories-icons";

/**
 * Coșul din varianta „Stories”. Folosește aceleași funcții și aceleași calcule
 * ca și coșul clasic (subtotal, promoții, comandă minimă, livrare gratuită).
 */
export function StoriesCartSheet() {
  const router = useRouter();
  const { items, total, isOpen, closeCart, updateQuantity, removeItem, addItem } = useCart();
  const { settings } = useRestaurantSettings();
  const { currentRestaurant } = useRestaurant();
  const { products } = useCatalog();
  const orderDiscount = useOrderDiscount(currentRestaurant?.id ?? items[0]?.product.restaurantId, items);
  const accent = currentRestaurant?.primaryColor || "#173A2E";
  const [closing, setClosing] = useState(false);
  const freeDeliveryRemaining = Math.max(0, settings.freeDeliveryThreshold - total);
  const minimumRemaining = Math.max(0, settings.minimumOrderValue - total);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      closeCart();
    }, 200);
  };

  const inCart = new Set(items.map((item) => item.product.id));
  const suggestions: Product[] = [];
  for (const item of items) {
    for (const id of item.product.recommendationIds ?? []) {
      const product = products.find((candidate) => candidate.id === id);
      if (product && product.active !== false && !product.soldOut && !inCart.has(id) && !suggestions.some((s) => s.id === id)) {
        suggestions.push(product);
      }
    }
  }

  const addSuggestion = (product: Product) => {
    if (needsRequiredChoice(product)) {
      closeCart();
      router.push(`/produs/${product.id}?from=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    addItem(product);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Coșul tău">
      <button type="button" aria-label="Închide coșul" onClick={close} className={`absolute inset-0 bg-[#0E1F19]/55 ${closing ? "stories-fade-out" : "stories-fade-in"}`} />
      <aside className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-xl flex-col overflow-hidden rounded-t-[30px] bg-white shadow-2xl ${closing ? "stories-sheet-out" : "stories-sheet-in"}`}>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-[22px] font-semibold">Coșul tău</h2>
          <button type="button" onClick={close} aria-label="Închide" className="grid size-10 place-items-center rounded-[13px] bg-[#F1EEE7]">
            <CloseIcon className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="grid min-h-72 place-items-center px-8 pb-10 text-center">
            <div>
              <div className="mx-auto grid size-20 place-items-center rounded-[24px] bg-[#F1EEE7]" style={{ color: accent }}>
                <BagIcon className="size-9" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Coșul este gol</h3>
              <p className="mt-2 text-sm text-[#6E6A62]">Alege ceva bun din meniu și revino aici.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              <p className="mb-1 text-[11.5px] font-bold text-[#8A857B]">Glisează un produs spre stânga ca să-l scoți.</p>
              {items.map((item) => (
                <SwipeRow key={item.lineId} item={item} accent={accent} onRemove={() => removeItem(item.lineId)} onQuantity={(q) => updateQuantity(item.lineId, q)} />
              ))}

              {suggestions.length > 0 && (
                <section className="mt-6">
                  <h3 className="text-lg font-semibold">Merge perfect cu</h3>
                  <div className="hide-scrollbar -mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1">
                    {suggestions.slice(0, 8).map((product, index) => (
                      <div key={product.id} className="stories-rise w-[112px] shrink-0 rounded-[18px] border-[1.5px] border-[#EEE9DF] p-2" style={{ animationDelay: `${index * 70}ms` }}>
                        <div className="relative h-16 overflow-hidden rounded-xl bg-[#FBF7EF]">
                          <SafeImage src={product.image} alt="" fallbackLabel={product.name} fill className="object-cover" sizes="112px" />
                        </div>
                        <p className="mt-1.5 line-clamp-2 h-8 text-[12px] font-bold leading-4">{product.name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <b className="text-[13px]" style={{ color: accent }}>{formatPrice(product.price)}</b>
                          <button type="button" onClick={() => addSuggestion(product)} aria-label={`Adaugă ${product.name}`} className="grid size-[26px] place-items-center rounded-[9px] text-white" style={{ backgroundColor: accent }}>
                            <PlusIcon className="size-3.5" strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="safe-bottom shrink-0 border-t border-[#EEE9DF] bg-white px-5 pt-3">
              <div className="space-y-1.5 text-[13.5px] font-bold text-[#6E6A62]">
                <div className="flex justify-between"><span>Produse</span><span className="text-[#14161C]">{formatPrice(total)}</span></div>
                {orderDiscount.amount > 0 && (
                  <div className="flex justify-between text-[#197a55]">
                    <span>{orderDiscount.name ? `Promoție: ${orderDiscount.name}` : "Reducere"}</span>
                    <span>-{formatPrice(orderDiscount.amount)}</span>
                  </div>
                )}
              </div>
              {settings.minimumOrderValue > 0 && minimumRemaining > 0 && (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                  Mai adaugă {formatPrice(minimumRemaining)} pentru comanda minimă.
                </p>
              )}
              {settings.acceptsDelivery && settings.freeDeliveryThreshold > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#F1EEE7]">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (total / settings.freeDeliveryThreshold) * 100)}%`, backgroundColor: accent }} />
                  </div>
                  <p className="mt-1.5 text-[11.5px] font-bold text-[#6E6A62]">
                    {freeDeliveryRemaining > 0 ?
                      `Mai adaugă ${formatPrice(freeDeliveryRemaining)} pentru livrare gratuită.`
                    : "Ai livrare gratuită pentru această comandă."}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  router.push("/checkout");
                }}
                className="mt-3 flex h-14 w-full items-center justify-between rounded-[18px] px-5 text-base font-black text-white shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: accent }}
              >
                <span>Continuă</span>
                <span>{formatPrice(Math.max(0, total - orderDiscount.amount))}</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function SwipeRow({
  item,
  accent,
  onRemove,
  onQuantity,
}: {
  item: CartItem;
  accent: string;
  onRemove: () => void;
  onQuantity: (quantity: number) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const horizontal = useRef(false);

  const remove = () => {
    setLeaving(true);
    window.setTimeout(onRemove, 220);
  };

  return (
    <div className={`relative mt-2.5 overflow-hidden rounded-[20px] transition-all duration-200 ${leaving ? "max-h-0 opacity-0" : "max-h-40"}`}>
      <button type="button" onClick={remove} aria-label={`Elimină ${item.product.name}`} className="absolute inset-0 flex items-center justify-end rounded-[20px] bg-[#C8302B] pr-6 text-white">
        <TrashIcon className="size-[22px]" />
      </button>
      <div
        className="relative flex touch-pan-y items-center gap-3 rounded-[20px] bg-[#FBF7EF] p-2.5"
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? "none" : "transform 200ms ease" }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          start.current = { x: event.clientX, y: event.clientY };
          horizontal.current = false;
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!start.current) return;
          const dx = event.clientX - start.current.x;
          const dy = event.clientY - start.current.y;
          if (!horizontal.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) horizontal.current = true;
          if (horizontal.current) setOffset(Math.min(0, Math.max(-110, dx + (offset < 0 && dx > 0 ? -74 : 0))));
        }}
        onPointerUp={() => {
          if (!start.current) return;
          start.current = null;
          setDragging(false);
          if (offset < -100) remove();
          else setOffset(offset < -40 ? -74 : 0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setOffset(0);
        }}
      >
        <div className="relative size-[62px] shrink-0 overflow-hidden rounded-[14px] bg-[#F1EEE7]">
          <SafeImage src={item.product.image} alt="" fallbackLabel={item.product.name} fill className="object-cover" sizes="62px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold">{item.product.name}</p>
          {item.selectedOptions.length > 0 && (
            <p className="line-clamp-2 text-[11px] leading-4 text-[#6E6A62]">
              {item.selectedOptions.map((option) => (option.quantity > 1 ? `${option.quantity}× ${option.optionName}` : option.optionName)).join(" · ")}
            </p>
          )}
          <b className="mt-0.5 block text-[15px]" style={{ color: accent }}>{formatPrice(calculateCartItemTotal(item))}</b>
        </div>
        <div className="flex h-9 items-center gap-2 rounded-[14px] bg-white px-1">
          <button type="button" onClick={() => onQuantity(item.quantity - 1)} aria-label={`Scade ${item.product.name}`} className="grid size-[26px] place-items-center rounded-[9px] bg-[#F1EEE7]">
            <MinusIcon className="size-3.5" />
          </button>
          <b className="min-w-4 text-center text-[13px]">{item.quantity}</b>
          <button type="button" onClick={() => onQuantity(item.quantity + 1)} aria-label={`Crește ${item.product.name}`} className="grid size-[26px] place-items-center rounded-[9px] bg-[#F1EEE7]">
            <PlusIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
