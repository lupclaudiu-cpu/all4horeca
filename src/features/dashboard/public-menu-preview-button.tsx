"use client";

import { EyeIcon } from "@/components/icons";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { markPublicLinkUsed } from "@/lib/setup-checklist";

/** „Așa văd clienții”: deschide meniul public (/r/[slug]) într-un tab nou. */
export function PublicMenuPreviewButton({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const { currentRestaurant } = useRestaurant();
  if (!currentRestaurant?.slug) return null;
  return (
    <a
      href={`/r/${encodeURIComponent(currentRestaurant.slug)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => markPublicLinkUsed(currentRestaurant.id)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
        variant === "dark" ?
           "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
          : "border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
      } ${className}`}
    >
      <EyeIcon className="size-5" />
      Așa văd clienții
    </a>
  );
}
