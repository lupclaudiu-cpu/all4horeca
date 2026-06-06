"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CartIcon, CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";

export function CartDrawer() {
  const router = useRouter();
  const { items, total, isOpen, closeCart, updateQuantity } = useCart();

  const goToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Închide coșul"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="safe-bottom absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:inset-y-0 md:left-auto md:w-[430px] md:max-h-none md:rounded-none">
        <div className="flex items-center justify-between border-b border-[#eee9e4] px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">
              Comanda ta
            </p>
            <h2 className="text-2xl font-black tracking-[-0.04em]">Coș</h2>
          </div>
          <button
            onClick={closeCart}
            className="grid size-11 place-items-center rounded-full bg-[#f5f2ef]"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="grid min-h-80 place-items-center px-8 text-center">
            <div>
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#fff1e9] text-[#ff5a1f]">
                <CartIcon className="size-9" />
              </div>
              <h3 className="mt-5 text-xl font-black">Coșul este gol</h3>
              <p className="mt-2 text-sm leading-6 text-[#7a746e]">
                Adaugă ceva delicios din meniu și revino aici.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto p-5 md:max-h-[calc(100vh-250px)]">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex gap-3 rounded-2xl border border-[#eee9e4] p-3"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#fff6ec]">
                    <Image
                      src={item.product.image}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black">
                      {item.product.name}
                    </h3>
                    <p className="mt-1 text-sm font-extrabold text-[#ff5a1f]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#7a746e]">
                        {item.selectedOptions
                          .map(
                            (option) =>
                              `${option.groupName}: ${option.optionName}`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-2 flex w-fit items-center gap-3 rounded-full bg-[#f5f2ef] p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.lineId, item.quantity - 1)
                        }
                        className="grid size-7 place-items-center rounded-full bg-white"
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
                        className="grid size-7 place-items-center rounded-full bg-white"
                      >
                        <PlusIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#eee9e4] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold text-[#7a746e]">Subtotal</span>
                <span className="text-2xl font-black">{formatPrice(total)}</span>
              </div>
              <button
                onClick={goToCheckout}
                className="w-full rounded-2xl bg-[#ff5a1f] px-5 py-4 font-black text-white shadow-xl shadow-[#ff5a1f]/20 transition active:scale-[0.98]"
              >
                Continuă către checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
