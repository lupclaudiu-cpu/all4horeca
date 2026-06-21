"use client";

import type { Category } from "@/lib/types";

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:flex-col lg:overflow-visible lg:px-0 lg:py-0">
      {categories.map((category) => {
        const selected = category.id === active;
        return (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={`antoria-focus flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition lg:w-full ${
              selected ?
                 "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50/50"
            }`}
          >
            <span className="text-xl">{category.icon}</span>
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
