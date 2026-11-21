"use client";

import { useRestaurant } from "@/features/restaurant/restaurant-context";

/** Bara de progres de deasupra finalizării, în varianta „Stories”. Doar afișare. */
export function StoriesCheckoutSteps({ loggedIn }: { loggedIn: boolean }) {
  const { currentRestaurant } = useRestaurant();
  const accent = currentRestaurant?.primaryColor || "#173A2E";
  const steps = ["Coș", loggedIn ? "Detalii comandă" : "Telefon", "Trimite"];
  const done = loggedIn ? 2 : 1;
  return (
    <div className="mx-auto flex max-w-5xl gap-1.5 px-4 pt-4 sm:px-6" aria-label="Pașii comenzii">
      {steps.map((step, index) => (
        <div key={step} className="flex-1">
          <div className="h-[5px] overflow-hidden rounded-full bg-[#E2DDD2]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: index < done ? "100%" : "0%", backgroundColor: accent }}
            />
          </div>
          <p className="mt-1.5 text-[11.5px] font-bold" style={{ color: index < done ? accent : "#8A857B" }}>
            {index + 1}. {step}
          </p>
        </div>
      ))}
    </div>
  );
}
