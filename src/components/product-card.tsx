"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const addOrConfigure = () => {
    if (product.optionGroups?.length) {
      router.push(`/produs/${product.id}`);
    } else {
      addItem(product);
    }
  };
  return (
    <article className="group min-w-0 overflow-hidden rounded-[1.75rem] border border-[#eee9e4] bg-white shadow-[0_12px_35px_rgba(32,21,13,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(32,21,13,0.1)]">
      <Link href={`/produs/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#fff6ec]">
        {product.featured && <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ff5a1f] backdrop-blur">Popular</span>}
        <Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 300px" />
      </Link>
      <div className="p-4">
        <Link href={`/produs/${product.id}`}>
          <h3 className="text-base font-black tracking-[-0.03em] sm:text-lg">{product.name}</h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-[#7a746e] sm:text-sm">{product.shortDescription}</p>
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-black text-[#ff5a1f]">{formatPrice(product.price)}</span>
          <button onClick={addOrConfigure} aria-label={`${product.optionGroups?.length ? "Configurează" : "Adaugă"} ${product.name}`} className="grid size-10 place-items-center rounded-full bg-[#171411] text-white shadow-lg transition active:scale-90">
            <PlusIcon className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
