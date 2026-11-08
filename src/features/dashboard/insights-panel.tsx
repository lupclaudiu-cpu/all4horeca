"use client";

import { useMemo } from "react";
import { formatPrice } from "@/data/restaurant";
import { buildInsights, type Range } from "@/features/dashboard/insights";
import type { Order } from "@/lib/types";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs font-bold text-slate-500">nou</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-black ${up ? "text-emerald-700" : "text-rose-700"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}% față de perioada anterioară
    </span>
  );
}

function Bars({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 font-bold text-slate-600">{row.label}</span>
          <div className="h-3 flex-1 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right font-black text-slate-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function InsightsPanel({ orders, range }: { orders: Order[]; range: Range }) {
  const data = useMemo(() => buildInsights(orders, range), [orders, range]);
  const activeHours = data.hours.filter((h) => h.orders > 0 || (h.hour >= 10 && h.hour <= 23));
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="rounded-[1.75rem] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-950">Comparație cu perioada anterioară</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">Comenzi</p>
            <p className="text-2xl font-black">{data.current.count}</p>
            <Change value={data.ordersChange} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Vânzări</p>
            <p className="text-2xl font-black">{formatPrice(data.current.sales)}</p>
            <Change value={data.salesChange} />
          </div>
        </div>
      </section>
      <section className="rounded-[1.75rem] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-950">Tipuri de comenzi</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs font-bold text-slate-500">Livrare</dt><dd className="font-black">{data.delivery.count} ({data.delivery.percent}%)</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">Ridicare</dt><dd className="font-black">{data.pickup.count} ({data.pickup.percent}%)</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">Numerar</dt><dd className="font-black">{data.cash.count} ({data.cash.percent}%)</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">Card</dt><dd className="font-black">{data.card.count} ({data.card.percent}%)</dd></div>
          <div className="col-span-2"><dt className="text-xs font-bold text-slate-500">Comenzi anulate</dt><dd className="font-black">{data.cancelled} ({data.cancelRate}% din total)</dd></div>
        </dl>
      </section>
      <section className="rounded-[1.75rem] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-950">Orele de vârf</h3>
        <p className="text-xs text-slate-600">
          {data.peakHour.orders ? `Cea mai aglomerată oră: ${data.peakHour.hour}:00 (${data.peakHour.orders} comenzi)` : "Nu sunt comenzi în perioadă."}
        </p>
        <Bars rows={activeHours.map((h) => ({ label: `${String(h.hour).padStart(2, "0")}:00`, value: h.orders }))} />
      </section>
      <section className="rounded-[1.75rem] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-950">Zilele săptămânii</h3>
        <Bars rows={[1, 2, 3, 4, 5, 6, 0].map((i) => ({ label: data.weekdays[i].label, value: data.weekdays[i].orders }))} />
      </section>
    </div>
  );
}
