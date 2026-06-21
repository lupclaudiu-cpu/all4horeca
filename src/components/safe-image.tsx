"use client";

import Image, { type ImageProps } from "next/image";
import { useMemo, useState } from "react";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackLabel?: string;
};

const invalidSources = new Set(["", "null", "undefined"]);

export function SafeImage({
  src,
  alt,
  fallbackLabel,
  className,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const safeSrc = useMemo(() => {
    const value = String(src ?? "").trim();
    if (invalidSources.has(value)) return null;
    return value;
  }, [src]);

  if (!safeSrc || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 text-center ${className ?? ""}`}
        aria-label={alt}
      >
        <div className="px-3">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-black text-white shadow-lg shadow-blue-600/20">
            {(fallbackLabel || alt || "A4").slice(0, 2).toUpperCase()}
          </span>
          <span className="mt-3 line-clamp-2 block text-[11px] font-black text-slate-500">
            {fallbackLabel || alt || "Imagine indisponibilă"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={safeSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
