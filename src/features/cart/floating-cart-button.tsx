"use client";

import { usePathname } from "next/navigation";
import { CartIcon } from "@/components/icons";
import { useCart } from "@/features/cart/cart-context";

export function FloatingCartButton() {
  const pathname = usePathname();
  const { itemCount, openCart, isOpen } = useCart();
  const clientRoute =
    pathname.startsWith("/clienti/") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/produs/") ||
    pathname === "/checkout" ||
    pathname === "/comenzi" ||
    pathname.startsWith("/cont");

  if (!clientRoute || isOpen) return null;
  const bottomPosition = pathname.startsWith("/produs/") ?
     "bottom-[160px]"
    : "bottom-[92px]";

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Deschide coșul, ${itemCount} produse`}
      className={`fixed right-4 z-40 grid size-14 place-items-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 active:scale-95 sm:right-6 ${bottomPosition}`}
    >
      <CartIcon className="size-6" />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-full bg-cyan-400 px-1.5 py-1 text-[10px] font-black text-slate-950 ring-4 ring-slate-50">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
