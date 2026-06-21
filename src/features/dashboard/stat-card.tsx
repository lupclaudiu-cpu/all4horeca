import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "blue",
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "orange" | "green" | "blue" | "violet";
  accent?: string;
}) {
  const tones = {
    orange: "from-amber-500 to-orange-500 text-white shadow-amber-500/20",
    green: "from-emerald-500 to-teal-500 text-white shadow-emerald-500/20",
    blue: "from-blue-600 to-cyan-500 text-white shadow-blue-500/20",
    violet: "from-violet-600 to-blue-500 text-white shadow-violet-500/20",
  };

  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(37,99,235,0.14)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-400" />
      {accent && (
        <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-blue-100/60 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {value}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500">{detail}</p>
        </div>
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-lg ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
    </article>
  );
}
