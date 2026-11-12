"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "a4h-order-sound";
const REPEAT_MS = 4000;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

function readEnabled() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function writeEnabled(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    // stocarea poate fi indisponibilă; ignorăm
  }
}

/** Sunet repetat cât timp există comenzi noi, cu buton de pornire (necesar pentru browsere). */
export function NewOrderSound({ newOrdersCount }: { newOrdersCount: number }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(readEnabled()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const beep = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    [0, 0.28].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
    });
  };

  useEffect(() => {
    if (!enabled || newOrdersCount <= 0) return;
    beep();
    const interval = window.setInterval(beep, REPEAT_MS);
    return () => window.clearInterval(interval);
  }, [enabled, newOrdersCount]);

  const toggle = () => {
    if (!enabled) {
      const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (Ctor && !ctxRef.current) ctxRef.current = new Ctor();
      setEnabled(true);
      writeEnabled(true);
      window.setTimeout(beep, 50);
    } else {
      setEnabled(false);
      writeEnabled(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title="Sunet la comandă nouă"
      className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {enabled ? "Sunet pornit" : "Pornește sunetul"}
    </button>
  );
}
