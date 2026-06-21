"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { useCatalog } from "@/features/catalog/catalog-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import type {
  Product,
  Promotion,
  PromotionInput,
  PromotionType,
} from "@/lib/types";
import {
  deletePromotion,
  getPromotions,
  savePromotion,
  updatePromotionActive,
} from "@/services/commercial-service";

const typeLabels: Record<PromotionType, string> = {
  first_order: "Prima comandă",
  loyalty: "Fidelitate",
  product_discount: "Reducere produse",
  happy_hour: "Happy Hour",
  custom: "Personalizată",
};

const emptyPromotion: PromotionInput = {
  name: "",
  description: "",
  type: "custom",
  discountPercent: 10,
  triggerOrderNumber: null,
  startsAt: null,
  endsAt: null,
  validFrom: null,
  validUntil: null,
  active: true,
  sortOrder: 0,
  productIds: [],
};

export function PromotionsDashboardPage() {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const { products } = useCatalog();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [editing, setEditing] = useState<Promotion | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setPromotions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPromotions(await getPromotions(restaurantId));
    } catch (reason) {
      setError(
        reason instanceof Error ?
           reason.message
          : "Promoțiile nu au putut fi încărcate.",
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleActive = async (promotion: Promotion) => {
    if (!restaurantId) return;
    setPendingId(promotion.id);
    setError(null);
    try {
      await updatePromotionActive(
        restaurantId,
        promotion.id,
        !promotion.active,
      );
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Actualizarea a eșuat.",
      );
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (promotion: Promotion) => {
    if (
      !restaurantId ||
      !window.confirm(`Ștergi promoția „${promotion.name}”?`)
    ) {
      return;
    }
    setPendingId(promotion.id);
    setError(null);
    try {
      await deletePromotion(restaurantId, promotion.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ștergerea a eșuat.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader
        eyebrow="Comercial"
        title="Promoții"
        description="Configurează promoțiile restaurantului. Motorul de aplicare automată va fi conectat într-o etapă ulterioară."
        action={
          <button
            type="button"
            disabled={!restaurantId}
            onClick={() => setEditing("new")}
            className="rounded-xl bg-[#2563eb] px-4 py-3 text-xs font-black text-white disabled:opacity-50"
          >
            Creează promoție
          </button>
        }
      />

      {error && (
        <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
        {loading ? (
          <div className="h-80 animate-pulse bg-[#f8fafc]" />
        ) : promotions.length ? (
          <div className="divide-y divide-[#e2e8f0]">
            {promotions.map((promotion) => (
              <article
                key={promotion.id}
                className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black">{promotion.name}</h2>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                      {typeLabels[promotion.type]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        promotion.active ?
                           "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {promotion.active ? "Activă" : "Inactivă"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#64748b]">
                    {promotion.description || "Fără descriere"}
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#2563eb]">
                    Reducere {promotion.discountPercent}%
                    {promotion.type === "loyalty" &&
                      promotion.triggerOrderNumber &&
                      ` · comanda ${promotion.triggerOrderNumber}`}
                    {promotion.type === "happy_hour" &&
                      ` · ${promotion.startsAt || "--:--"}-${promotion.endsAt || "--:--"}`}
                    {promotion.type === "product_discount" &&
                      ` · ${promotion.productIds.length} produse`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pendingId === promotion.id}
                  onClick={() => void toggleActive(promotion)}
                  className="rounded-xl bg-[#f1f5f9] px-4 py-3 text-xs font-black"
                >
                  {promotion.active ? "Dezactivează" : "Activează"}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(promotion)}
                    className="rounded-xl bg-[#0f172a] px-4 py-3 text-xs font-black text-white"
                  >
                    Editează
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === promotion.id}
                    onClick={() => void remove(promotion)}
                    className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                  >
                    Șterge
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="p-10 text-center text-sm font-bold text-[#64748b]">
            Nu există promoții configurate.
          </p>
        )}
      </section>

      {editing && restaurantId && (
        <PromotionModal
          restaurantId={restaurantId}
          promotion={editing === "new" ? undefined : editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function PromotionModal({
  restaurantId,
  promotion,
  products,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  promotion?: Promotion;
  products: Product[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [data, setData] = useState<PromotionInput>(() =>
    promotion
      ? {
          name: promotion.name,
          description: promotion.description,
          type: promotion.type,
          discountPercent: promotion.discountPercent,
          triggerOrderNumber: promotion.triggerOrderNumber,
          startsAt: promotion.startsAt,
          endsAt: promotion.endsAt,
          validFrom: promotion.validFrom,
          validUntil: promotion.validUntil,
          active: promotion.active,
          sortOrder: promotion.sortOrder,
          productIds: promotion.productIds,
        }
      : { ...emptyPromotion },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof PromotionInput>(
    key: K,
    value: PromotionInput[K],
  ) => setData((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await savePromotion(restaurantId, data, promotion?.id);
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Salvarea a eșuat.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6">
      <form
        onSubmit={submit}
        className="mx-auto max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">
            {promotion ? "Editează promoția" : "Promoție nouă"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-black text-[#64748b]"
          >
            Închide
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Nume"
            value={data.name}
            onChange={(value) => update("name", value)}
          />
          <label>
            <span className="text-xs font-black">Tip promoție</span>
            <select
              value={data.type}
              onChange={(event) =>
                update("type", event.target.value as PromotionType)
              }
              className={inputClass}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <label>
              <span className="text-xs font-black">Descriere</span>
              <textarea
                value={data.description}
                rows={3}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>
          <Field
            label="Reducere %"
            type="number"
            value={String(data.discountPercent)}
            onChange={(value) => update("discountPercent", Number(value))}
          />
          <Field
            label="Ordine afișare"
            type="number"
            value={String(data.sortOrder)}
            onChange={(value) => update("sortOrder", Number(value))}
          />
          <Field
            label="Valabilă de la"
            type="date"
            value={data.validFrom ?? ""}
            onChange={(value) => update("validFrom", value || null)}
          />
          <Field
            label="Valabilă până la"
            type="date"
            value={data.validUntil ?? ""}
            onChange={(value) => update("validUntil", value || null)}
          />

          {(data.type === "first_order" || data.type === "loyalty") && (
            <Field
              label="Numărul comenzii eligibile"
              type="number"
              value={String(data.triggerOrderNumber ?? 1)}
              onChange={(value) =>
                update("triggerOrderNumber", Number(value))
              }
            />
          )}
          {data.type === "happy_hour" && (
            <>
              <Field
                label="Începe la"
                type="time"
                value={data.startsAt ?? ""}
                onChange={(value) => update("startsAt", value)}
              />
              <Field
                label="Se termină la"
                type="time"
                value={data.endsAt ?? ""}
                onChange={(value) => update("endsAt", value)}
              />
            </>
          )}
        </div>

        {data.type === "product_discount" && (
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2563eb]">
              Produse selectate
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {products.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-3 py-3 text-xs font-black"
                >
                  <span>{product.name}</span>
                  <input
                    type="checkbox"
                    checked={data.productIds.includes(product.id)}
                    onChange={(event) =>
                      update(
                        "productIds",
                        event.target.checked ?
                           [...data.productIds, product.id]
                          : data.productIds.filter((id) => id !== product.id),
                      )
                    }
                    className="size-4 accent-[#2563eb]"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="mt-5 flex items-center justify-between rounded-xl border border-[#e2e8f0] p-4 text-sm font-black">
          Promoție activă
          <input
            type="checkbox"
            checked={data.active}
            onChange={(event) => update("active", event.target.checked)}
            className="size-5 accent-[#2563eb]"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={
            saving ||
            !data.name.trim() ||
            data.discountPercent < 0 ||
            data.discountPercent > 100
          }
          className="mt-6 w-full rounded-2xl bg-[#2563eb] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {saving ? "Se salvează..." : "Salvează promoția"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#2563eb]";

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="text-xs font-black">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}
