"use client";

import { useEffect, useState } from "react";

const GUIDE_STORAGE_KEY = "all4horeca-dashboard-guide-v1";

const screens = [
  {
    title: "Meniu",
    text: "Adaugă categoriile și produsele. Folosește „Adăugare rapidă” sau importă un fișier Excel/CSV ca să termini în câteva minute.",
  },
  {
    title: "Comenzi live",
    text: "Comenzile noi apar instant în „Comenzi”, cu sunet și insignă roșie. Le accepți, le pregătești și le marchezi livrate dintr-o atingere.",
  },
  {
    title: "Link și QR",
    text: "Din „QR & SEO” copiezi link-ul meniului și descarci codul QR pentru mese, Facebook și Google. Butonul „Așa văd clienții” îți arată meniul public.",
  },
];

function readSeen() {
  try {
    return window.localStorage.getItem(GUIDE_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function writeSeen() {
  try {
    window.localStorage.setItem(GUIDE_STORAGE_KEY, "1");
  } catch {
    // localStorage indisponibil: ghidul poate reapărea, nu blocăm nimic.
  }
}

/** Ghid de prima intrare: 3 ecrane scurte, afișat o singură dată pe dispozitiv. */
export function FirstRunGuide() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(!readSeen()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  const screen = screens[index];
  const last = index === screens.length - 1;
  const close = () => {
    writeSeen();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-guide-title"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
          Bun venit · {index + 1} din {screens.length}
        </p>
        <h2
          id="first-run-guide-title"
          className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950"
        >
          {screen.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{screen.text}</p>
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {screens.map((item, dot) => (
            <span
              key={item.title}
              className={`h-1.5 flex-1 rounded-full ${dot <= index ? "bg-blue-600" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-xl px-4 text-sm font-black text-slate-500"
          >
            Sari peste
          </button>
          <button
            type="button"
            onClick={() => (last ? close() : setIndex(index + 1))}
            className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
          >
            {last ? "Am înțeles" : "Înainte"}
          </button>
        </div>
      </div>
    </div>
  );
}
