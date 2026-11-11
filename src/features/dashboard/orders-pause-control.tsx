"use client";

import { useEffect, useRef, useState } from "react";
import { useRestaurantSettings } from "@/features/settings/settings-context";

/** Buton „Pauză comenzi” din antetul panoului: 30 / 60 de minute sau până la reactivare. */
export function OrdersPauseControl({ disabled }: { disabled?: boolean }) {
  const { settings, ordersPaused, setOrdersPause, hydrated } =
    useRestaurantSettings();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const apply = async (value: number | "manual" | null) => {
    setPending(true);
    setError(null);
    try {
      await setOrdersPause(value);
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Acțiune eșuată.");
    } finally {
      setPending(false);
    }
  };

  const untilLabel =
    ordersPaused && settings.ordersPausedUntil ?
       `până la ${new Date(settings.ordersPausedUntil).toLocaleTimeString("ro-RO", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : ordersPaused ?
         "până la reactivare"
        : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled || !hydrated || pending}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-50 ${
          ordersPaused ?
             "border-amber-300 bg-amber-100 text-amber-900"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {ordersPaused ? "În pauză" : "Pauză comenzi"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-2xl">
          {ordersPaused ? (
            <>
              <p className="px-3 py-2 text-xs font-bold text-amber-800">
                Comenzile noi sunt oprite {untilLabel}. Clienții văd mesajul
                „Restaurantul nu primește comenzi momentan”.
              </p>
              <PauseOption label="Reia comenzile acum" onClick={() => void apply(null)} strong />
            </>
          ) : (
            <>
              <p className="px-3 py-2 text-xs font-bold text-slate-500">
                Oprește temporar comenzile noi. Comenzile deja primite rămân
                active.
              </p>
              <PauseOption label="Pauză 30 de minute" onClick={() => void apply(30)} />
              <PauseOption label="Pauză 60 de minute" onClick={() => void apply(60)} />
              <PauseOption label="Până reactivez" onClick={() => void apply("manual")} />
            </>
          )}
          {error && (
            <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PauseOption({
  label,
  onClick,
  strong,
}: {
  label: string;
  onClick: () => void;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-xl px-3 py-3 text-left font-black transition ${
        strong ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "text-slate-800 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
