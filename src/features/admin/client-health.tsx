"use client";

import Link from "next/link";
import type { AdminRestaurant } from "@/lib/types";

function daysSince(iso: string | null | undefined, now: number) {
  if (!iso || !now) return null;
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

function health(item: AdminRestaurant, now: number) {
  const days = daysSince(item.lastOrderAt, now);
  if (!item.isActive) return { label: "Inactiv", tone: "bg-slate-100 text-slate-700" };
  if (days === null) return { label: "Fără comenzi", tone: "bg-amber-100 text-amber-800" };
  if (days <= 3) return { label: "Activ", tone: "bg-emerald-100 text-emerald-800" };
  if (days <= 14) return { label: "Scăzut", tone: "bg-amber-100 text-amber-800" };
  return { label: "Risc de renunțare", tone: "bg-rose-100 text-rose-800" };
}

function onboarding(item: AdminRestaurant) {
  const steps = [
    ["Contract semnat", Boolean(item.contractSigned)],
    ["Date firmă (CUI)", Boolean(item.vatCui)],
    ["Contact completat", Boolean(item.contactPhone || item.contactEmail)],
    ["Prima comandă", item.orderCount > 0],
  ] as const;
  return { done: steps.filter(([, ok]) => ok).length, total: steps.length, missing: steps.filter(([, ok]) => !ok).map(([n]) => n) };
}

export function ClientHealth({ restaurants, now }: { restaurants: AdminRestaurant[]; now: number }) {
  if (!restaurants.length) return null;
  return (
    <section className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Sănătatea clienților</h2>
      <p className="text-xs text-slate-600">Cine folosește aplicația și cine riscă să renunțe.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="py-2">Restaurant</th>
              <th>Stare</th>
              <th>Comenzi 7 zile</th>
              <th>Comenzi 30 zile</th>
              <th>Ultima comandă</th>
              <th>Onboarding</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((item) => {
              const h = health(item, now);
              const days = daysSince(item.lastOrderAt, now);
              const ob = onboarding(item);
              return (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="py-2.5 font-black">
                    <Link href={`/admin/restaurante/${item.id}`} className="underline">{item.name}</Link>
                  </td>
                  <td><span className={`rounded-full px-2 py-1 text-xs font-black ${h.tone}`}>{h.label}</span></td>
                  <td className="font-bold">{item.orders7d ?? 0}</td>
                  <td className="font-bold">{item.orders30d ?? 0}</td>
                  <td>{days === null ? "—" : days === 0 ? "azi" : `acum ${days} zile`}</td>
                  <td>
                    <span className="font-bold">{ob.done}/{ob.total}</span>
                    {ob.missing.length > 0 && <span className="block text-xs text-slate-600">Lipsește: {ob.missing.join(", ")}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
