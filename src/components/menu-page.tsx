"use client";

import { useState } from "react";
import { CartIcon } from "@/components/icons";
import { CategoryTabs } from "@/components/category-tabs";
import { ProductCard } from "@/components/product-card";
import { restaurant } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useCatalog } from "@/features/catalog/catalog-context";

export function MenuPage() {
  const { products, categories, loading, error, refresh } = useCatalog();
  const [activeCategory, setActiveCategory] = useState("");
  const { itemCount, openCart } = useCart();
  const visibleCategories = categories.filter((item) => item.active !== false);
  const resolvedCategory = activeCategory || visibleCategories[0]?.id || "";
  const filteredProducts = products.filter(
    (product) =>
      product.categoryId === resolvedCategory &&
      product.active !== false &&
      !product.soldOut,
  );
  const activeName = visibleCategories.find((item) => item.id === resolvedCategory)?.name;

  return (
    <div className="page-enter pb-32">
      <section className="relative overflow-hidden bg-[#171411] px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[#ff5a1f]/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb899]">Comandă direct</p>
          <div className="mt-2 flex items-end justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h2 className="max-w-lg text-3xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">Ce poftă ai azi?</h2>
              <p className="mt-3 text-sm text-white/65">Proaspăt pregătit · {restaurant.schedule}</p>
            </div>
            <button onClick={openCart} className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-[#ff5a1f] text-white shadow-xl shadow-[#ff5a1f]/20 transition active:scale-95" aria-label="Deschide coșul">
              <CartIcon className="size-6" />
              {itemCount > 0 && <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-white text-[11px] font-black text-[#171411]">{itemCount}</span>}
            </button>
          </div>
        </div>
      </section>
      <div className="sticky top-[73px] z-20 border-b border-[#eee9e4] bg-white/95 backdrop-blur-xl lg:hidden">
        <CategoryTabs categories={visibleCategories} active={resolvedCategory} onChange={setActiveCategory} />
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-7 sm:px-6 lg:grid-cols-[190px_1fr] lg:py-10">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#a19a94]">Categorii</p>
            <CategoryTabs categories={visibleCategories} active={resolvedCategory} onChange={setActiveCategory} />
          </div>
        </aside>
        <main className="min-w-0">
          <div className="mb-5 flex items-end justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">Meniul nostru</p><h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{activeName}</h2></div>
            <span className="text-xs font-bold text-[#a19a94]">{filteredProducts.length} produse</span>
          </div>
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p className="font-black">Catalogul nu este disponibil.</p>
              <p className="mt-1">{error}</p>
              <button onClick={() => void refresh()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white">Reîncearcă</button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[3/4] animate-pulse rounded-[1.75rem] bg-[#f3efeb]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
