import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "orange",
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "orange" | "green" | "blue" | "violet";
}) {
  const tones = {
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <article className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(24,18,12,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-[#8b8580]">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em]">{value}</p>
          <p className="mt-2 text-[11px] text-[#a19a94]">{detail}</p>
        </div>
        <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
          {icon}
        </span>
      </div>
    </article>
  );
}
