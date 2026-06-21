"use client";

import { useRouter } from "next/navigation";
import {
  CartIcon,
  CloseIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useRestaurantSettings } from "@/features/settings/settings-context";
import { calculateCartItemTotal } from "@/lib/cart-pricing";

export function CartDrawer() {
  const router = useRouter();
  const { items, total, isOpen, closeCart, updateQuantity, removeItem } =
    useCart();
  const { settings } = useRestaurantSettings();
  const freeDeliveryRemaining = Math.max(
    0,
    settings.freeDeliveryThreshold - total,
  );
  const minimumRemaining = Math.max(0, settings.minimumOrderValue - total);
  const promotionSavings = 0;

  const goToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Închide coșul"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="safe-bottom absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:inset-y-0 md:left-auto md:w-[430px] md:max-h-none md:rounded-none">
        <div className="antoria-gradient flex items-center justify-between px-5 py-5 text-white">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              Comanda ta
            </p>
            <h2 className="text-2xl font-black tracking-[-0.04em]">Coș</h2>
          </div>
          <button
            onClick={closeCart}
            className="grid size-11 place-items-center rounded-full bg-white/10 text-white"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="grid min-h-80 place-items-center px-8 text-center">
            <div>
              <div className="mx-auto grid size-20 place-items-center rounded-[1.5rem] bg-cyan-50 text-blue-700">
                <CartIcon className="size-9" />
              </div>
              <h3 className="mt-5 text-xl font-black">Coșul este gol</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Alege produsele preferate din meniu și revino aici pentru
                finalizare.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto bg-slate-50 p-4 min-[390px]:max-h-[55vh] min-[390px]:p-5 md:max-h-[calc(100vh-250px)]">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-cyan-50">
                    <SafeImage
                      src={item.product.image}
                      alt=""
                      fallbackLabel={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black">
                      {item.product.name}
                    </h3>
                    <p className="mt-1 text-sm font-extrabold text-blue-700">
                      {formatPrice(calculateCartItemTotal(item))}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                        {item.selectedOptions
                          .map(
                            (option) =>
                              `${option.groupName}: ${option.quantity} × ${option.optionName}`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex w-fit items-center gap-3 rounded-full bg-slate-100 p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.lineId, item.quantity - 1)
                          }
                          className="grid size-7 place-items-center rounded-full bg-white shadow-sm"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="min-w-4 text-center text-xs font-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.lineId, item.quantity + 1)
                          }
                          className="grid size-7 place-items-center rounded-full bg-white shadow-sm"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        className="grid size-8 place-items-center rounded-full bg-red-50 text-red-600"
                        aria-label={`Elimină ${item.product.name}`}
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 bg-white p-5">
              <div className="mb-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                <SummaryRow label="Subtotal" value={formatPrice(total)} />
                <SummaryRow
                  label="Economii promoții"
                  value={formatPrice(promotionSavings)}
                  muted
                />
                {settings.minimumOrderValue > 0 && minimumRemaining > 0 && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                    Mai adaugă {formatPrice(minimumRemaining)} pentru comanda
                    minimă.
                  </p>
                )}
                {settings.freeDeliveryThreshold > 0 &&
                  freeDeliveryRemaining > 0 && (
                    <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                      Mai adaugă {formatPrice(freeDeliveryRemaining)} pentru
                      livrare gratuită.
                    </p>
                  )}
                {settings.freeDeliveryThreshold > 0 &&
                  freeDeliveryRemaining === 0 && (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                      Ai livrare gratuită pentru această comandă.
                    </p>
                  )}
              </div>
              <button
                onClick={goToCheckout}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-blue-600/20 transition hover:brightness-105 active:scale-[0.98]"
              >
                Finalizează comanda
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span
        className={`font-black ${muted ? "text-emerald-600" : "text-slate-950"}`}
      >
        {value}
      </span>
    </div>
  );
}
