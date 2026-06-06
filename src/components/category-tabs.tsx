"use client";

import type { Category } from "@/lib/types";

export function CategoryTabs({ categories, active, onChange }: {
  categories: Category[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:flex-col lg:overflow-visible lg:px-0 lg:py-0">
      {categories.map((category) => {
        const selected = category.id === active;
        return (
          <button key={category.id} onClick={() => onChange(category.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition lg:w-full ${selected ? "bg-[#171411] text-white shadow-lg shadow-black/10" : "bg-[#f7f4f1] text-[#5e5852] hover:bg-[#eee9e4]"}`}>
            <span className="text-xl">{category.icon}</span>{category.name}
          </button>
        );
      })}
    </div>
  );
}
