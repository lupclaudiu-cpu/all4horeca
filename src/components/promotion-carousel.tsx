"use client";

import { useEffect, useState } from "react";
import type { Promotion } from "@/lib/types";
import { getActivePromotions } from "@/services/public-promotions-service";

export function PromotionCarousel({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void getActivePromotions(restaurantId)
      .then((items) => {
        if (active) setPromotions(items);
      })
      .catch(() => {
        if (active) setPromotions([]);
      });
    return () => {
      active = false;
    };
  }, [restaurantId]);

  useEffect(() => {
    if (promotions.length < 2) return;
    const interval = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % promotions.length),
      5500,
    );
    return () => window.clearInterval(interval);
  }, [promotions.length]);

  if (!promotions.length) return null;
  const promotion = promotions[activeIndex] ?? promotions[0];

  return (
    <section className="mx-auto max-w-6xl px-4 pt-5">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-5 text-white shadow-xl shadow-blue-600/15 sm:p-7">
        <div className="absolute -right-10 -top-14 size-44 rounded-full border border-white/20" />
        <div className="absolute -bottom-16 right-16 size-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative max-w-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">
            Ofertă activă
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                {promotion.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-blue-50/85">
                {promotion.description || promotionDetail(promotion)}
              </p>
            </div>
            <span className="shrink-0 rounded-2xl bg-white px-3 py-2 text-lg font-black text-blue-700 shadow-lg">
              -{promotion.discountPercent}%
            </span>
          </div>
          {promotion.type === "happy_hour" && promotion.startsAt && (
            <p className="mt-3 text-xs font-black text-cyan-100">
              {promotion.startsAt} - {promotion.endsAt}
            </p>
          )}
        </div>
        {promotions.length > 1 && (
          <div className="relative mt-5 flex gap-2">
            {promotions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Afișează promoția ${item.name}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-8 bg-white" : "w-3 bg-white/35"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function promotionDetail(promotion: Promotion) {
  if (promotion.type === "first_order") return "Reducere la prima comandă.";
  if (promotion.type === "loyalty") {
    return `Reducere la comanda ${promotion.triggerOrderNumber ?? 11}.`;
  }
  if (promotion.type === "happy_hour") return "Ofertă disponibilă în intervalul promoțional.";
  if (promotion.type === "product_discount") return "Reducere la produsele selectate.";
  return "Promoție specială ALL4HORECA.";
}
