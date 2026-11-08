"use client";

import { useEffect, useState } from "react";
import type { Promotion } from "@/lib/types";
import { getActivePromotions } from "@/services/public-promotions-service";

export function PromotionCarousel({
  restaurantId,
  accent = "#0e7490",
}: {
  restaurantId: string;
  accent?: string;
}) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

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

  if (!promotions.length) return null;

  return (
    <section aria-label="Promoții active" className="pt-4">
      <h2 className="px-3 pb-2 text-sm font-black text-slate-950">
        Promoții active
      </h2>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-3">
        {promotions.map((promotion) => (
          <div
            key={promotion.id}
            className="flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5"
          >
            <span
              className="min-w-14 shrink-0 rounded-xl px-2 py-2.5 text-center text-base font-black text-white"
              style={{ backgroundColor: accent }}
            >
              −{promotion.discountPercent}%
            </span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-black text-slate-950">
                {promotion.name}
              </p>
              <p className="line-clamp-2 text-xs leading-snug text-slate-600">
                {promotion.description || promotionDetail(promotion)}
                {promotion.type === "happy_hour" && promotion.startsAt
                  ? ` ${promotion.startsAt}–${promotion.endsAt}`
                  : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function promotionDetail(promotion: Promotion) {
  if (promotion.type === "first_order") return "Reducere la prima comandă.";
  if (promotion.type === "loyalty") {
    return `Reducere la comanda ${promotion.triggerOrderNumber ?? 11}.`;
  }
  if (promotion.type === "happy_hour") return "Ofertă în intervalul promoțional.";
  if (promotion.type === "product_discount") return "Reducere la produsele selectate.";
  return "Promoție specială.";
}
