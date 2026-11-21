"use client";

import { useCallback, useEffect, useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { CloseIcon } from "@/features/stories-ui/stories-icons";
import type { Product } from "@/lib/types";

export type StorySlide = {
  key: string;
  kicker: string;
  title: string;
  text?: string;
  image?: string | null;
  product?: Product;
};

export type Story = {
  id: string;
  label: string;
  image?: string | null;
  badge?: string;
  slides: StorySlide[];
};

const SLIDE_MS = 5000;

/** Povești pe tot ecranul: avansează singure, atingi dreapta/stânga pentru următoarea/anterioara. */
export function StoryViewer({
  stories,
  startIndex,
  accent,
  onClose,
  onSeen,
  onOpenProduct,
}: {
  stories: Story[];
  startIndex: number;
  accent: string;
  onClose: () => void;
  onSeen: (storyId: string) => void;
  onOpenProduct: (product: Product) => void;
}) {
  const [storyIndex, setStoryIndex] = useState(startIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const story = stories[storyIndex];
  const slide = story?.slides[slideIndex];

  const next = useCallback(() => {
    if (!story) return;
    if (slideIndex < story.slides.length - 1) {
      setSlideIndex((value) => value + 1);
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex((value) => value + 1);
      setSlideIndex(0);
    } else {
      onClose();
    }
  }, [onClose, slideIndex, stories.length, story, storyIndex]);

  const previous = () => {
    if (slideIndex > 0) setSlideIndex((value) => value - 1);
    else if (storyIndex > 0) {
      setStoryIndex((value) => value - 1);
      setSlideIndex(0);
    }
  };

  useEffect(() => {
    if (story) onSeen(story.id);
  }, [onSeen, story]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(next, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [next, paused, slideIndex, storyIndex]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!story || !slide) return null;

  return (
    <div
      className="stories-fade-in fixed inset-0 z-[70] mx-auto flex max-w-xl flex-col bg-[#0E1F19] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={story.label}
    >
      <div className="absolute inset-0">
        {slide.image ? (
          <SafeImage key={slide.key} src={slide.image} alt="" fallbackLabel={slide.title} fill className="stories-zoom object-cover" sizes="100vw" />
        ) : (
          <div className="h-full w-full" style={{ background: `radial-gradient(circle at 70% 20%, ${accent}, #0E1F19 70%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/80" />
      </div>

      <div className="relative z-10 flex gap-1 px-3 pt-[max(12px,env(safe-area-inset-top))]">
        {story.slides.map((item, index) => (
          <div key={item.key} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              key={`${storyIndex}-${slideIndex}-${index}`}
              className={`h-full bg-white ${index === slideIndex && !paused ? "stories-progress" : ""}`}
              style={{
                width: index < slideIndex ? "100%" : index === slideIndex && paused ? "50%" : index === slideIndex ? undefined : "0%",
                animationDuration: `${SLIDE_MS}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="relative z-10 flex items-center justify-between px-4 pt-3">
        <p className="text-sm font-black">{story.label}</p>
        <button type="button" onClick={onClose} aria-label="Închide povestea" className="grid size-10 place-items-center rounded-full bg-black/25">
          <CloseIcon className="size-5" />
        </button>
      </div>

      <button
        type="button"
        aria-label="Înapoi"
        className="absolute inset-y-0 left-0 z-[5] w-1/3"
        onClick={previous}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      />
      <button
        type="button"
        aria-label="Înainte"
        className="absolute inset-y-0 right-0 z-[5] w-2/3"
        onClick={next}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      />

      <div key={slide.key} className="stories-rise relative z-10 mt-auto px-5 pb-[max(28px,env(safe-area-inset-bottom))]">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#E3B33C]">{slide.kicker}</p>
        <h2 className="mt-2 text-[34px] font-semibold leading-[1.05]">{slide.title}</h2>
        {slide.text && <p className="mt-2 max-w-sm text-sm leading-6 text-white/85">{slide.text}</p>}
        {slide.product && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProduct(slide.product!);
            }}
            className="relative z-20 mt-5 flex h-14 w-full items-center justify-between rounded-[18px] bg-white px-5 text-base font-black text-[#14161C]"
          >
            <span>Vreau asta</span>
            <span style={{ color: accent }}>{formatPrice(slide.product.price)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
