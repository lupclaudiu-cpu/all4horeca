"use client";

import { ClockIcon, StarIcon } from "@/components/icons";
import { restaurant } from "@/data/restaurant";
import { useRestaurantSettings } from "@/features/settings/settings-context";

export function RestaurantHeader() {
  const { settings, restaurantOpen } = useRestaurantSettings();

  return (
    <header className="sticky top-0 z-30 border-b border-[#eee9e4] bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#171411] text-sm font-black text-white shadow-lg shadow-black/10">
          {restaurant.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-extrabold tracking-[-0.035em] sm:text-xl">{restaurant.name}</h1>
            <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${restaurantOpen ? "bg-[#eaf8f1] text-[#197a55]" : "bg-red-50 text-red-700"}`}>
              {restaurantOpen ? "Deschis" : "Închis"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-[#7a746e]">
            <span className="flex items-center gap-1"><ClockIcon className="size-3.5" />{settings.openingTime} - {settings.closingTime}</span>
            <span className="flex items-center gap-1"><StarIcon className="size-3.5 fill-[#ffb020] stroke-[#ffb020]" />{restaurant.rating}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
