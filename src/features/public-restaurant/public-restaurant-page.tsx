"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import type { Category, Product } from "@/lib/types";
import { getProducts } from "@/services/supabase-service";
import { useRouter } from "next/navigation";

type PublicRestaurant = {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
};

export function PublicRestaurantPage({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getProducts(restaurant.id)
      .then((catalog) => {
        setProducts(
          catalog.products.filter(
            (product) => product.active !== false && !product.soldOut,
          ),
        );
        setCategories(
          catalog.categories.filter((category) => category.active !== false),
        );
      })
      .finally(() => setLoading(false));
  }, [restaurant.id]);

  const visible = useMemo(
    () =>
      selected === "all"
        ? products
        : products.filter((product) => product.categoryId === selected),
    [products, selected],
  );

  return (
    <main
      className="min-h-screen bg-[#fffaf6] pb-28"
      style={{ "--restaurant-color": restaurant.primaryColor } as React.CSSProperties}
    >
      <header className="bg-white px-4 pb-5 pt-6 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#fff1e8] text-xl font-black">
            {restaurant.logoUrl ? (
              <Image src={restaurant.logoUrl} alt="" fill className="object-cover" />
            ) : (
              restaurant.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: restaurant.primaryColor }}>Comandă online</p>
            <h1 className="truncate text-2xl font-black">{restaurant.name}</h1>
            <p className="mt-1 truncate text-xs text-[#817a74]">{restaurant.address}</p>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 overflow-x-auto border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-max max-w-6xl gap-2">
          <CategoryButton active={selected === "all"} color={restaurant.primaryColor} onClick={() => setSelected("all")}>Toate</CategoryButton>
          {categories.map((category) => (
            <CategoryButton key={category.id} active={selected === category.id} color={restaurant.primaryColor} onClick={() => setSelected(category.id)}>
              {category.icon} {category.name}
            </CategoryButton>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-3 py-6 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-3xl bg-white" />)
          : visible.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_35px_rgba(32,21,13,.06)]">
                <div className="relative aspect-[4/3] bg-[#fff1e8]">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {product.bestseller && <Tag text="Bestseller" />}
                    {product.isNew && <Tag text="Nou" />}
                  </div>
                </div>
                <div className="p-3">
                  <h2 className="line-clamp-1 text-sm font-black">{product.name}</h2>
                  <p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-4 text-[#817a74]">{product.shortDescription}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-black" style={{ color: restaurant.primaryColor }}>{formatPrice(product.price)}</span>
                    <button type="button" onClick={() => {
                      if (product.optionGroups?.length) {
                        router.push(`/produs/${product.id}`);
                      } else {
                        addItem(product);
                        openCart();
                      }
                    }} className="grid size-9 place-items-center rounded-full text-white" style={{ backgroundColor: restaurant.primaryColor }} aria-label={`Adaugă ${product.name}`}>
                      <PlusIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
      </section>
      {!loading && !visible.length && <p className="px-6 py-20 text-center text-sm font-bold text-[#817a74]">Nu sunt produse disponibile în această categorie.</p>}
    </main>
  );
}

function CategoryButton({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-black" style={{ backgroundColor: active ? color : "#f3efeb", color: active ? "white" : "#514b46" }}>{children}</button>;
}

function Tag({ text }: { text: string }) {
  return <span className="rounded-full bg-white/90 px-2 py-1 text-[8px] font-black uppercase text-[#ff5a1f]">{text}</span>;
}
