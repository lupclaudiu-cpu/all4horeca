"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/data/restaurant";
import { useCatalog } from "@/features/catalog/catalog-context";
import { LiveOrdersPage } from "@/features/dashboard/live-orders-page";
import { useOrders } from "@/features/orders/order-context";
import { getSupabaseClient } from "@/lib/supabase/client";

type Tab = "orders" | "soldout" | "report";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "orders", label: "Comenzi" },
  { id: "soldout", label: "Epuizat" },
  { id: "report", label: "Raport zi" },
];

export function LocationPage() {
  const [tab, setTab] = useState<Tab>("orders");
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${
              tab === item.id ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "orders" && <LiveOrdersPage />}
      {tab === "soldout" && <SoldOutPanel />}
      {tab === "report" && <DayReport />}
    </div>
  );
}

function SoldOutPanel() {
  const { products, refresh } = useCatalog();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visible = products
    .filter((p) => p.active !== false)
    .filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  const toggle = async (id: string, soldOut: boolean) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusyId(id);
    setError(null);
    const { error: rpcError } = await supabase.rpc("set_product_sold_out", {
      p_product_id: id,
      p_sold_out: soldOut,
    });
    if (rpcError) setError("Nu s-a putut salva. Încearcă din nou.");
    else await refresh();
    setBusyId(null);
  };

  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black">Produse epuizate</h2>
      <p className="text-xs text-slate-600">Apasă pe un produs ca să-l marchezi epuizat; clienții nu îl mai pot comanda.</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Caută produs"
        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
      />
      {error && <p role="alert" className="mt-2 text-sm font-bold text-rose-700">{error}</p>}
      <ul className="mt-3 divide-y divide-slate-100">
        {visible.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-3">
            <span className={`text-sm font-bold ${p.soldOut ? "text-slate-500 line-through" : ""}`}>{p.name}</span>
            <button
              type="button"
              disabled={busyId === p.id}
              onClick={() => void toggle(p.id, !p.soldOut)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black ${
                p.soldOut ? "bg-emerald-600 text-white" : "bg-rose-100 text-rose-800"
              }`}
            >
              {p.soldOut ? "Disponibil din nou" : "Marchează epuizat"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayReport() {
  const { orders } = useOrders();
  const report = useMemo(() => {
    const today = new Date();
    const todays = orders.filter((o) => new Date(o.createdAt).toDateString() === today.toDateString());
    const valid = todays.filter((o) => o.status !== "Anulată");
    const sum = (list: typeof valid) => Math.round(list.reduce((s, o) => s + o.total, 0) * 100) / 100;
    return {
      count: valid.length,
      total: sum(valid),
      cash: sum(valid.filter((o) => o.paymentMethod === "cash")),
      card: sum(valid.filter((o) => o.paymentMethod === "card")),
      delivery: valid.filter((o) => o.orderType === "delivery").length,
      pickup: valid.filter((o) => o.orderType === "pickup").length,
      cancelled: todays.length - valid.length,
    };
  }, [orders]);
  const rows: Array<[string, string]> = [
    ["Comenzi azi", String(report.count)],
    ["Total încasări", formatPrice(report.total)],
    ["Numerar de predat", formatPrice(report.cash)],
    ["Card", formatPrice(report.card)],
    ["Livrări", String(report.delivery)],
    ["Ridicări", String(report.pickup)],
    ["Anulate", String(report.cancelled)],
  ];
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Raport de zi</h2>
      <dl className="mt-3 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-3 text-sm">
            <dt className="font-bold text-slate-600">{label}</dt>
            <dd className="font-black">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
