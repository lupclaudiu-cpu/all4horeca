"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, ClockIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { useCart } from "@/features/cart/cart-context";
import { useCatalog } from "@/features/catalog/catalog-context";
import type { SelectedProductOption } from "@/lib/types";

export function ProductDetail({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [selectionError, setSelectionError] = useState("");
  const { products, loading, error, refresh } = useCatalog();
  const { addItem, openCart } = useCart();
  const product = products.find(
    (item) => item.id === productId && item.active !== false && !item.soldOut,
  );

  if (loading) {
    return <main className="min-h-screen animate-pulse bg-[#fff9f3]"><div className="aspect-[4/3] bg-[#ffe9d8]" /><div className="mx-5 -mt-8 h-96 rounded-[2rem] bg-white" /></main>;
  }
  if (error || !product) {
    return <main className="grid min-h-screen place-items-center px-6 text-center"><div><h1 className="text-2xl font-black">Produs indisponibil</h1><p className="mt-2 text-sm text-[#7a746e]">{error || "Produsul nu mai există în catalog."}</p><button onClick={() => void refresh()} className="mt-6 rounded-xl bg-[#171411] px-5 py-3 text-sm font-black text-white">Reîncearcă</button></div></main>;
  }

  const selectedOptions: SelectedProductOption[] = (product.optionGroups ?? []).flatMap((group) =>
    group.options.filter((option) => selected[group.id]?.includes(option.id)).map((option) => ({
      groupId: group.id, groupName: group.name, optionId: option.id,
      optionName: option.name, priceDelta: option.priceDelta,
    })),
  );
  const unitPrice = product.price + selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const recommendations = product.recommendationIds?.map((id) => products.find((item) => item.id === id)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item && item.active !== false && !item.soldOut),
  ) ?? [];

  const selectOption = (groupId: string, type: "single" | "multiple", optionId: string) => {
    setSelectionError("");
    setSelected((current) => {
      if (type === "single") return { ...current, [groupId]: [optionId] };
      const values = current[groupId] ?? [];
      return { ...current, [groupId]: values.includes(optionId) ? values.filter((id) => id !== optionId) : [...values, optionId] };
    });
  };

  const handleAdd = () => {
    const missing = (product.optionGroups ?? []).find((group) => group.required && !selected[group.id]?.length);
    if (missing) {
      setSelectionError(`Selectează o opțiune pentru ${missing.name}.`);
      return;
    }
    addItem(product, quantity, selectedOptions);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <main className="page-enter min-h-screen bg-[#fff9f3] pb-40">
      <div className="relative mx-auto max-w-4xl">
        <div className="relative aspect-[4/3] max-h-[560px] overflow-hidden bg-[#ffe9d8] sm:rounded-b-[3rem]">
          <Image src={product.image} alt={product.name} fill priority className="object-cover" sizes="(max-width: 900px) 100vw, 900px" />
          <Link href="/" aria-label="Înapoi la meniu" className="absolute left-4 top-4 grid size-12 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur"><ArrowLeftIcon className="size-6" /></Link>
        </div>
        <section className="relative -mt-8 rounded-t-[2rem] bg-white px-5 pb-8 pt-7 sm:-mt-14 sm:mx-8 sm:rounded-[2.25rem] sm:px-8">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#ded9d4] sm:hidden" />
          <div className="flex items-start justify-between gap-6">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">Preparat proaspăt</p><h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">{product.name}</h1></div>
            <span className="shrink-0 text-xl font-black text-[#ff5a1f] sm:text-2xl">{formatPrice(unitPrice)}</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#706963] sm:text-base">{product.description}</p>
          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#7a746e]"><ClockIcon className="size-4 text-[#ff5a1f]" />Timp de preparare: {product.prepTime}</div>

          {(product.optionGroups ?? []).map((group) => (
            <div key={group.id} className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a19a94]">{group.name}</p>
                <span className="rounded-full bg-[#f5f2ef] px-2 py-1 text-[9px] font-black text-[#7a746e]">{group.required ? "Obligatoriu" : "Opțional"}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {group.options.map((option) => {
                  const checked = selected[group.id]?.includes(option.id) ?? false;
                  return (
                    <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-bold transition ${checked ? "border-[#ff5a1f] bg-[#fff4ed]" : "border-[#e7e1dc]"}`}>
                      <input type={group.selectionType === "single" ? "radio" : "checkbox"} name={group.id} checked={checked} onChange={() => selectOption(group.id, group.selectionType, option.id)} className="size-4 accent-[#ff5a1f]" />
                      <span className="min-w-0 flex-1">{option.name}<span className="mt-1 block text-[11px] text-[#a19a94]">{option.priceDelta ? `+${formatPrice(option.priceDelta)}` : "Inclus"}</span></span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {selectionError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{selectionError}</p>}

          {recommendations.length > 0 && (
            <div className="mt-8 border-t border-[#eee9e4] pt-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">Se comandă frecvent împreună</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {recommendations.map((item) => <button key={item.id} type="button" onClick={() => addItem(item)} className="flex items-center justify-between rounded-2xl border border-[#eee9e4] px-4 py-3 text-left"><span><span className="block text-sm font-black">{item.name}</span><span className="text-xs text-[#ff5a1f]">{formatPrice(item.price)}</span></span><PlusIcon className="size-5" /></button>)}
              </div>
            </div>
          )}
        </section>
      </div>
      <div className="safe-bottom fixed inset-x-0 bottom-[73px] z-30 border-t border-[#eee9e4] bg-white/95 px-4 py-3 backdrop-blur-xl md:left-1/2 md:max-w-4xl md:-translate-x-1/2">
        <div className="mx-auto flex max-w-3xl gap-3">
          <div className="flex items-center gap-4 rounded-2xl bg-[#f5f2ef] px-3"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid size-10 place-items-center"><MinusIcon className="size-5" /></button><span className="min-w-4 text-center font-black">{quantity}</span><button onClick={() => setQuantity((value) => value + 1)} className="grid size-10 place-items-center"><PlusIcon className="size-5" /></button></div>
          <button onClick={added ? openCart : handleAdd} className="flex-1 rounded-2xl bg-[#ff5a1f] px-4 py-4 font-black text-white shadow-xl shadow-[#ff5a1f]/20 transition active:scale-[0.98]">{added ? "Adăugat · Vezi coșul" : `Adaugă · ${formatPrice(unitPrice * quantity)}`}</button>
        </div>
      </div>
    </main>
  );
}
