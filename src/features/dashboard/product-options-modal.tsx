"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Product, ProductOptionGroup } from "@/lib/types";
import {
  deleteProductOptionGroup,
  getProductOptionGroups,
  saveProductOptionGroup,
  setProductOptionGroupActive,
} from "@/services/commercial-service";

const emptyGroup: Omit<ProductOptionGroup, "id"> = {
  name: "",
  selectionType: "single",
  required: false,
  active: true,
  sortOrder: 0,
  options: [],
};

export function ProductOptionsModal({
  product,
  onClose,
  onChanged,
}: {
  product: Product;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [editing, setEditing] = useState<ProductOptionGroup | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setGroups(await getProductOptionGroups(product.id));
    setLoading(false);
  }, [product.id]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Ștergi acest grup și toate opțiunile lui?")) return;
    await deleteProductOptionGroup(id);
    await load();
    await onChanged();
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#ff5a1f]">Variante și extra</p>
            <h2 className="text-2xl font-black">{product.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-black text-[#8b8580]">Închide</button>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="mt-5 rounded-xl bg-[#ff5a1f] px-4 py-3 text-xs font-black text-white">Creează grup</button>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
        <div className="mt-5 space-y-3">
          {loading ? <div className="h-32 animate-pulse rounded-2xl bg-[#f5f2ef]" /> : groups.map((group) => (
            <article key={group.id} className="rounded-2xl border border-[#eee9e4] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black">{group.name}</p>
                  <p className="mt-1 text-[11px] text-[#8b8580]">
                    {group.selectionType === "single" ? "Alegere unică" : "Alegere multiplă"} · {group.required ? "Obligatoriu" : "Opțional"} · Ordine {group.sortOrder}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void setProductOptionGroupActive(group.id, !group.active).then(load).then(onChanged).catch((reason) => setError(String(reason)))} className="rounded-xl bg-[#f3f0ed] px-3 py-2 text-[11px] font-black">{group.active ? "Dezactivează" : "Activează"}</button>
                  <button type="button" onClick={() => setEditing(group)} className="rounded-xl bg-[#171411] px-3 py-2 text-[11px] font-black text-white">Modifică</button>
                  <button type="button" onClick={() => void remove(group.id)} className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-black text-red-600">Șterge</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) => <span key={option.id} className="rounded-full bg-[#fff4ed] px-3 py-2 text-[10px] font-black">{option.name} {option.priceDelta ? `+${option.priceDelta} lei` : ""}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
      {editing && (
        <GroupForm
          productId={product.id}
          group={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function GroupForm({ productId, group, onClose, onSaved }: { productId: string; group?: ProductOptionGroup; onClose: () => void; onSaved: () => Promise<void> }) {
  const [data, setData] = useState<Omit<ProductOptionGroup, "id">>(() => group ? {
    name: group.name, selectionType: group.selectionType, required: group.required,
    active: group.active, sortOrder: group.sortOrder, options: group.options,
  } : emptyGroup);
  const [saving, setSaving] = useState(false);
  const addOption = () => setData((current) => ({ ...current, options: [...current.options, { id: crypto.randomUUID(), name: "", priceDelta: 0, active: true, sortOrder: current.options.length }] }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await saveProductOptionGroup(productId, data, group?.id);
    await onSaved();
  };
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 p-4">
      <form onSubmit={submit} className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6">
        <div className="flex justify-between"><h3 className="text-xl font-black">{group ? "Modifică grup" : "Creează grup"}</h3><button type="button" onClick={onClose} className="text-xs font-black">Închide</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Nume grup" value={data.name} onChange={(name) => setData({ ...data, name })} />
          <label className="text-xs font-black">Tip<select value={data.selectionType} onChange={(event) => setData({ ...data, selectionType: event.target.value as "single" | "multiple" })} className={inputClass}><option value="single">Single Choice</option><option value="multiple">Multiple Choice</option></select></label>
          <Field label="Ordine" type="number" value={String(data.sortOrder)} onChange={(value) => setData({ ...data, sortOrder: Number(value) })} />
          <div className="flex gap-3"><Check label="Obligatoriu" checked={data.required} onChange={(required) => setData({ ...data, required })} /><Check label="Activ" checked={data.active} onChange={(active) => setData({ ...data, active })} /></div>
        </div>
        <div className="mt-6 flex items-center justify-between"><p className="text-xs font-black uppercase text-[#ff5a1f]">Opțiuni</p><button type="button" onClick={addOption} className="rounded-xl bg-[#f3f0ed] px-3 py-2 text-xs font-black">Adaugă opțiune</button></div>
        <div className="mt-3 space-y-2">
          {data.options.map((option, index) => (
            <div key={option.id} className="grid gap-2 rounded-xl border border-[#eee9e4] p-3 sm:grid-cols-[1fr_120px_90px_auto]">
              <input value={option.name} placeholder="Nume" onChange={(event) => setData({ ...data, options: data.options.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} className={compactClass} />
              <input type="number" step=".5" value={option.priceDelta} onChange={(event) => setData({ ...data, options: data.options.map((item, itemIndex) => itemIndex === index ? { ...item, priceDelta: Number(event.target.value) } : item) })} className={compactClass} />
              <input type="number" value={option.sortOrder} onChange={(event) => setData({ ...data, options: data.options.map((item, itemIndex) => itemIndex === index ? { ...item, sortOrder: Number(event.target.value) } : item) })} className={compactClass} />
              <button type="button" onClick={() => setData({ ...data, options: data.options.filter((_, itemIndex) => itemIndex !== index) })} className="text-xs font-black text-red-600">Șterge</button>
            </div>
          ))}
        </div>
        <button disabled={saving || !data.name || data.options.some((option) => !option.name)} className="mt-6 w-full rounded-2xl bg-[#ff5a1f] px-5 py-4 text-sm font-black text-white disabled:opacity-50">{saving ? "Se salvează..." : "Salvează grupul"}</button>
      </form>
    </div>
  );
}

const inputClass = "mt-2 w-full rounded-xl border border-[#e6e0db] px-4 py-3 text-sm";
const compactClass = "min-w-0 rounded-lg border border-[#e6e0db] px-3 py-2 text-xs";
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="text-xs font-black">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#ff5a1f]" />{label}</label>; }
