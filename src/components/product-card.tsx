"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { SafeImage } from "@/components/safe-image";
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
    <article className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_55px_rgba(37,99,235,0.12)]">
      <Link
        href={`/produs/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50"
      >
        {product.featured && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-cyan-100 bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-700 shadow-sm backdrop-blur">
            Recomandat
          </span>
        )}
        <SafeImage
          src={product.image}
          alt={product.name}
          fallbackLabel={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 300px"
        />
      </Link>
      <div className="p-4">
        <Link href={`/produs/${product.id}`}>
          <h3 className="text-base font-extrabold tracking-[-0.03em] text-slate-950 sm:text-lg">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 sm:text-sm">
            {product.shortDescription}
          </p>
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-black text-blue-700">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={addOrConfigure}
            aria-label={`${product.optionGroups?.length ? "Configurează" : "Adaugă"} ${product.name}`}
            className="antoria-focus grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20 transition hover:scale-105 active:scale-95"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
