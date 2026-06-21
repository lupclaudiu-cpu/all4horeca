"use client";

import { FormEvent, useRef, useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { formatPrice } from "@/data/restaurant";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { useCatalog } from "@/features/catalog/catalog-context";
import type { Product, ProductInput } from "@/lib/types";
import {
  importProductsFile,
  saveProduct,
  updateProductAvailability,
  uploadProductImage,
} from "@/services/commercial-service";
import { ProductOptionsModal } from "@/features/dashboard/product-options-modal";
import { useRestaurant } from "@/features/restaurant/restaurant-context";

const emptyProduct: ProductInput = {
  name: "",
  description: "",
  categoryId: "",
  price: 0,
  weight: "",
  ingredients: "",
  allergens: "",
  prepTime: "15-25 min",
  vatRate: 9,
  active: true,
  soldOut: false,
  featured: false,
  bestseller: false,
  isNew: false,
  sortOrder: 0,
  recommendationIds: [],
};

export function ProductsDashboardPage() {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const accessLocked = Boolean(currentRestaurant?.accessLocked);
  const { products, categories, loading, error, refresh } = useCatalog();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [optionsProduct, setOptionsProduct] = useState<Product | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "sold_out" | "featured"
  >("all");
  const importRef = useRef<HTMLInputElement>(null);
  const activeCount = products.filter(
    (product) => product.active !== false && !product.soldOut,
  ).length;
  const inactiveCount = products.filter(
    (product) => product.active === false,
  ).length;
  const soldOutCount = products.filter((product) => product.soldOut).length;
  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.shortDescription]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" &&
        product.active !== false &&
        !product.soldOut) ||
      (statusFilter === "inactive" && product.active === false) ||
      (statusFilter === "sold_out" && product.soldOut) ||
      (statusFilter === "featured" && product.featured);
    return matchesSearch && matchesStatus;
  });

  const availability = async (
    product: Product,
    updates: { active?: boolean; soldOut?: boolean },
  ) => {
    if (accessLocked) {
      setActionError(
        "Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.",
      );
      return;
    }
    setPendingId(product.id);
    setActionError(null);
    try {
      await updateProductAvailability(product.id, updates);
      await refresh();
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : "Actualizare eșuată.",
      );
    } finally {
      setPendingId(null);
    }
  };

  const importFile = async (file?: File) => {
    if (!file || !restaurantId) return;
    if (accessLocked) {
      setActionError(
        "Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.",
      );
      return;
    }
    setImporting(true);
    setActionError(null);
    try {
      const count = await importProductsFile(restaurantId, file);
      await refresh();
      window.alert(`${count} produse au fost importate.`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Import eșuat.");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Catalog"
        title="Produse"
        description="Administrează produsele, disponibilitatea, imaginile și recomandările."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={accessLocked}
              onClick={() => importRef.current?.click()}
              className="rounded-xl bg-white px-4 py-3 text-xs font-black shadow-sm disabled:opacity-50"
            >
              {importing ? "Se importă..." : "Import XLSX / CSV"}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => void importFile(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={!restaurantId || accessLocked}
              onClick={() => {
                if (accessLocked) {
                  setActionError(
                    "Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.",
                  );
                  return;
                }
                if (!restaurantId) {
                  setActionError(
                    "Contul nu este legat de un restaurant. Verific asocierea proprietarului ?n zona Super administrator.",
                  );
                  return;
                }
                setEditing("new");
              }}
              className="rounded-xl bg-[#2563eb] px-4 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adaugă produs
            </button>
          </div>
        }
      />

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge text={`${activeCount} active`} tone="green" />
        <Badge text={`${inactiveCount} inactive`} />
        <Badge text={`${soldOutCount} epuizate`} tone="red" />
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Caută produs
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Caută după nume sau descriere"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </label>
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Filtru
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["all", "Toate"],
                ["active", "Active"],
                ["inactive", "Inactive"],
                ["sold_out", "Epuizate"],
                ["featured", "Recomandate"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      id as "all" | "active" | "inactive" | "sold_out" | "featured",
                    )
                  }
                  className={`rounded-xl px-3 py-2 text-xs font-black ${
                    statusFilter === id ?
                       "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {(error || actionError) && (
        <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError || error}
        </p>
      )}
      {!restaurantId && (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Profilul autentificat nu are un restaurant asociat. Ad?ugarea manual?
          este disponibil imediat dup asocierea contului proprietar.
        </p>
      )}
      {accessLocked && (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Perioada gratuit a expirat. Contacteaz ANTORIA pentru activarea contului.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="h-80 animate-pulse bg-[#f8fafc]" />
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {filteredProducts.map((product) => {
              const category = categories.find(
                (item) => item.id === product.categoryId,
              );
              return (
                <article
                  key={product.id}
                  className="grid gap-4 p-4 md:grid-cols-[1.5fr_.8fr_.6fr_1fr] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f0f9ff]">
                      <SafeImage
                        src={product.image}
                        alt=""
                        fallbackLabel={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1">
                        {product.featured && <SmallBadge text="Recomandat" />}
                        {product.bestseller && <SmallBadge text="Bestseller" />}
                        {product.isNew && <SmallBadge text="Nou" />}
                      </div>
                      <p className="mt-1 truncate text-sm font-black">{product.name}</p>
                      <p className="mt-1 truncate text-[11px] text-[#64748b]">
                        {product.weight || product.prepTime}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">{category?.name || "Fără categorie"}</p>
                  <p className="text-sm font-black text-[#2563eb]">
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      disabled={accessLocked}
                      onClick={() => setOptionsProduct(product)}
                      className="rounded-xl bg-[#eff6ff] px-3 py-2 text-[11px] font-black text-[#0369a1] disabled:opacity-50"
                    >
                      Variante & Extra
                    </button>
                    <button
                      type="button"
                      disabled={accessLocked || pendingId === product.id}
                      onClick={() =>
                        void availability(product, {
                          soldOut: !product.soldOut,
                        })
                      }
                      className={`rounded-xl px-3 py-2 text-[11px] font-black ${
                        product.soldOut ?
                           "bg-red-600 text-white"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {product.soldOut ? "Epuizat" : "Marchează epuizat"}
                    </button>
                    <button
                      type="button"
                      disabled={accessLocked || pendingId === product.id}
                      onClick={() =>
                        void availability(product, {
                          active: product.active === false,
                        })
                      }
                      className="rounded-xl bg-[#f1f5f9] px-3 py-2 text-[11px] font-black disabled:opacity-50"
                    >
                      {product.active === false ? "Activează" : "Dezactivează"}
                    </button>
                    <button
                      type="button"
                      disabled={accessLocked}
                      onClick={() => setEditing(product)}
                      className="rounded-xl bg-[#0f172a] px-3 py-2 text-[11px] font-black text-white disabled:opacity-50"
                    >
                      Modifică
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {editing && restaurantId && (
        <ProductModal
          restaurantId={restaurantId}
          product={editing === "new" ? undefined : editing}
          products={products}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
      {optionsProduct && (
        <ProductOptionsModal
          product={optionsProduct}
          onClose={() => setOptionsProduct(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function ProductModal({
  restaurantId,
  product,
  products,
  categories,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  product?: Product;
  products: Product[];
  categories: ReturnType<typeof useCatalog>["categories"];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [data, setData] = useState<ProductInput>(() =>
    product
      ? {
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price,
          weight: product.weight || "",
          ingredients: product.ingredients || "",
          allergens: product.allergens || "",
          prepTime: product.prepTime,
          vatRate: product.vatRate ?? 9,
          active: product.active !== false,
          soldOut: product.soldOut ?? false,
          featured: product.featured ?? false,
          bestseller: product.bestseller ?? false,
          isNew: product.isNew ?? false,
          sortOrder: product.sortOrder ?? 0,
          imageUrl: product.image,
          recommendationIds: product.recommendationIds ?? [],
        }
      : { ...emptyProduct, categoryId: categories[0]?.id || "" },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K],
  ) => setData((current) => ({ ...current, [key]: value }));

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      update("imageUrl", await uploadProductImage(restaurantId, file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload eșuat.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveProduct(restaurantId, data, product?.id);
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Salvare eșuată.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6">
      <form onSubmit={submit} className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">{product ? "Modifică produs" : "Adaugă produs"}</h2>
          <button type="button" onClick={onClose} className="text-xs font-black text-[#64748b]">Închide</button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ProductField label="Nume produs" value={data.name} onChange={(value) => update("name", value)} />
          <label><span className="text-xs font-black">Categorie</span><select value={data.categoryId} onChange={(event) => update("categoryId", event.target.value)} className={inputClass}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="sm:col-span-2"><ProductArea label="Descriere" value={data.description} onChange={(value) => update("description", value)} /></div>
          <ProductField label="Preț" value={String(data.price)} onChange={(value) => update("price", Number(value))} type="number" step="0.01" />
          <ProductField label="Gramaj" value={data.weight} onChange={(value) => update("weight", value)} placeholder="Ex: 450 g" />
          <ProductArea label="Ingrediente" value={data.ingredients} onChange={(value) => update("ingredients", value)} />
          <ProductArea label="Alergeni" value={data.allergens} onChange={(value) => update("allergens", value)} />
          <ProductField label="Timp preparare" value={data.prepTime} onChange={(value) => update("prepTime", value)} />
          <ProductField label="TVA %" value={String(data.vatRate)} onChange={(value) => update("vatRate", Number(value))} type="number" />
          <ProductField label="Ordine afișare" value={String(data.sortOrder)} onChange={(value) => update("sortOrder", Number(value))} type="number" />
          <label><span className="text-xs font-black">Poză produs</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0])} className={inputClass} /></label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ProductCheck label="Activ" checked={data.active} onChange={(value) => update("active", value)} />
          <ProductCheck label="Epuizat" checked={data.soldOut} onChange={(value) => update("soldOut", value)} />
          <ProductCheck label="Featured product" checked={data.featured} onChange={(value) => update("featured", value)} />
          <ProductCheck label="Bestseller" checked={data.bestseller} onChange={(value) => update("bestseller", value)} />
          <ProductCheck label="Nou" checked={data.isNew} onChange={(value) => update("isNew", value)} />
        </div>

        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2563eb]">Cumpărate frecvent împreună</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {products.filter((item) => item.id !== product?.id).map((item) => (
              <ProductCheck
                key={item.id}
                label={item.name}
                checked={data.recommendationIds.includes(item.id)}
                onChange={(checked) =>
                  update(
                    "recommendationIds",
                    checked ?
                       [...data.recommendationIds, item.id]
                      : data.recommendationIds.filter((id) => id !== item.id),
                  )
                }
              />
            ))}
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        <button disabled={saving || uploading || !data.name || !data.categoryId} className="mt-6 w-full rounded-2xl bg-[#2563eb] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
          {uploading ? "Se încarcă imaginea..." : saving ? "Se salvează..." : "Salvează produsul"}
        </button>
      </form>
    </div>
  );
}

const inputClass = "mt-2 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#2563eb]";

function ProductField({ label, value, onChange, type = "text", placeholder, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; step?: string }) {
  return <label><span className="text-xs font-black">{label}</span><input type={type} step={step} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}
function ProductArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="text-xs font-black">{label}</span><textarea value={value} rows={3} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}
function ProductCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] px-3 py-3 text-xs font-black"><span className="truncate">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#2563eb]" /></label>;
}
function Badge({ text, tone = "gray" }: { text: string; tone?: "green" | "red" | "gray" }) {
  const styles = tone === "green" ? "bg-emerald-100 text-emerald-700" : tone === "red" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-600";
  return <span className={`rounded-full px-3 py-2 text-xs font-black ${styles}`}>{text}</span>;
}
function SmallBadge({ text }: { text: string }) {
  return <span className="rounded-full bg-[#ecfeff] px-2 py-1 text-[8px] font-black uppercase text-[#0369a1]">{text}</span>;
}
