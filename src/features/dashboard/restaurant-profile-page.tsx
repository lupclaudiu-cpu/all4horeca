"use client";

import { FormEvent, useEffect, useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { PublicMenuPreviewButton } from "@/features/dashboard/public-menu-preview-button";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import {
  updateRestaurantProfile,
  uploadRestaurantImage,
  type RestaurantProfileInput,
} from "@/services/commercial-service";

const lockedMessage =
  "Accesul restaurantului este suspendat. Contactează ALL4HORECA pentru reactivare.";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#2563eb] focus:bg-white";

export function RestaurantProfilePage() {
  const { currentRestaurant, refreshRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id;
  const accessLocked = Boolean(currentRestaurant?.accessLocked);
  const [form, setForm] = useState<RestaurantProfileInput | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!currentRestaurant || loadedId === currentRestaurant.id) return;
    const timer = window.setTimeout(() => {
      setForm({
        name: currentRestaurant.name,
        logoUrl: currentRestaurant.logoUrl,
        coverImageUrl: currentRestaurant.coverImageUrl ?? null,
        primaryColor: /^#[0-9a-f]{6}$/i.test(currentRestaurant.primaryColor) ?
           currentRestaurant.primaryColor
          : "#2563eb",
        phone: currentRestaurant.phone ?? "",
        address: currentRestaurant.address ?? "",
        facebookUrl: currentRestaurant.facebookUrl ?? "",
        instagramUrl: currentRestaurant.instagramUrl ?? "",
      });
      setLoadedId(currentRestaurant.id);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentRestaurant, loadedId]);

  if (!form || !restaurantId) {
    return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-3xl bg-white" />;
  }

  const update = <K extends keyof RestaurantProfileInput>(
    key: K,
    value: RestaurantProfileInput[K],
  ) => setForm((current) => (current ? { ...current, [key]: value } : current));

  const upload = async (kind: "logo" | "cover", file?: File) => {
    if (!file) return;
    if (accessLocked) {
      setMessage({ type: "error", text: lockedMessage });
      return;
    }
    setUploading(kind);
    setMessage(null);
    try {
      const url = await uploadRestaurantImage(restaurantId, file, kind);
      update(kind === "logo" ? "logoUrl" : "coverImageUrl", url);
      setMessage({
        type: "success",
        text: "Imaginea a fost încărcată. Apasă „Salvează profilul” ca să o publici.",
      });
    } catch (reason) {
      setMessage({
        type: "error",
        text: reason instanceof Error ? reason.message : "Imaginea nu a putut fi încărcată.",
      });
    } finally {
      setUploading(null);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (accessLocked) {
      setMessage({ type: "error", text: lockedMessage });
      return;
    }
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Numele afișat este obligatoriu." });
      return;
    }
    const badLink = [form.facebookUrl, form.instagramUrl].find(
      (link) => link.trim() && !/^https?:\/\//i.test(link.trim()),
    );
    if (badLink) {
      setMessage({
        type: "error",
        text: "Link-urile de Facebook și Instagram trebuie să înceapă cu https://",
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateRestaurantProfile(restaurantId, form);
      await refreshRestaurant();
      setMessage({ type: "success", text: "Profilul a fost salvat și apare în meniul clienților." });
    } catch (reason) {
      setMessage({
        type: "error",
        text: reason instanceof Error ? reason.message : "Profilul nu a putut fi salvat.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <DashboardHeader
        eyebrow="Configurare"
        title="Profil restaurant"
        description="Logo, copertă, culoare și date de contact afișate clienților în meniul online."
        action={<PublicMenuPreviewButton />}
      />

      {accessLocked && (
        <p className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          {lockedMessage}
        </p>
      )}

      <form
        onSubmit={save}
        className={`mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr] ${
          accessLocked ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <section className="space-y-5 rounded-[1.5rem] bg-white p-5 shadow-[0_12px_30px_rgba(31,22,16,0.05)]">
          <label className="block text-sm font-bold">
            Nume afișat
            <input
              value={form.name}
              maxLength={120}
              onChange={(event) => update("name", event.target.value)}
              className={fieldClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageField
              label="Logo"
              hint="Pătrat, minimum 256×256 px"
              value={form.logoUrl}
              busy={uploading === "logo"}
              onFile={(file) => void upload("logo", file)}
              onRemove={() => update("logoUrl", null)}
              square
            />
            <ImageField
              label="Imagine de copertă"
              hint="Lată, de exemplu 1600×600 px"
              value={form.coverImageUrl}
              busy={uploading === "cover"}
              onFile={(file) => void upload("cover", file)}
              onRemove={() => update("coverImageUrl", null)}
            />
          </div>

          <label className="block text-sm font-bold">
            Culoare principală
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] p-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(event) => update("primaryColor", event.target.value)}
                className="size-10 rounded-lg"
                aria-label="Alege culoarea principală"
              />
              <span className="text-xs font-black">{form.primaryColor}</span>
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Telefon
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                maxLength={40}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="07xx xxx xxx"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-bold">
              Adresă
              <input
                value={form.address}
                maxLength={300}
                onChange={(event) => update("address", event.target.value)}
                placeholder="Strada, număr, oraș"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-bold">
              Link Facebook
              <input
                type="url"
                inputMode="url"
                value={form.facebookUrl}
                onChange={(event) => update("facebookUrl", event.target.value)}
                placeholder="https://facebook.com/..."
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-bold">
              Link Instagram
              <input
                type="url"
                inputMode="url"
                value={form.instagramUrl}
                onChange={(event) => update("instagramUrl", event.target.value)}
                placeholder="https://instagram.com/..."
                className={fieldClass}
              />
            </label>
          </div>

          {message && (
            <p
              role="status"
              className={`rounded-xl px-4 py-3 text-sm font-bold ${
                message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || Boolean(uploading) || accessLocked}
            className="min-h-11 w-full rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Se salvează..." : "Salvează profilul"}
          </button>
        </section>

        <ProfilePreview form={form} />
      </form>
    </div>
  );
}

function ImageField({
  label,
  hint,
  value,
  busy,
  onFile,
  onRemove,
  square,
}: {
  label: string;
  hint: string;
  value: string | null;
  busy: boolean;
  onFile: (file?: File) => void;
  onRemove: () => void;
  square?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-bold">{label}</p>
      <div
        className={`relative mt-2 overflow-hidden rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] ${
          square ? "aspect-square max-w-40" : "aspect-[8/3]"
        }`}
      >
        {value ? (
          <SafeImage src={value} alt="" fallbackLabel={label} fill className="object-cover" sizes="320px" />
        ) : (
          <span className="grid h-full place-items-center px-3 text-center text-xs font-bold text-slate-400">
            Nicio imagine
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{hint} · JPG, PNG sau WEBP, max. 7 MB</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white">
          {busy ? "Se încarcă..." : value ? "Schimbă" : "Încarcă"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 rounded-xl bg-red-50 px-4 text-xs font-black text-red-700"
          >
            Elimină
          </button>
        )}
      </div>
    </div>
  );
}

/** Previzualizare simplificată a antetului din meniul public. */
function ProfilePreview({ form }: { form: RestaurantProfileInput }) {
  return (
    <aside className="h-fit overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 shadow-sm lg:sticky lg:top-24">
      <p className="bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        Previzualizare
      </p>
      {form.coverImageUrl && (
        <div className="relative h-28 bg-slate-200">
          <SafeImage src={form.coverImageUrl} alt="" fallbackLabel={form.name} fill className="object-cover" sizes="400px" />
        </div>
      )}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
        <div
          className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-black"
          style={{ backgroundColor: `${form.primaryColor}22`, color: form.primaryColor }}
        >
          {form.logoUrl ? (
            <SafeImage src={form.logoUrl} alt="" fallbackLabel={form.name} fill className="object-cover" sizes="40px" />
          ) : (
            form.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <p className="truncate text-base font-black text-slate-950">{form.name || "Numele restaurantului"}</p>
      </div>
      <div className="p-3">
        <div
          className="rounded-2xl px-4 py-3 text-base font-black text-white"
          style={{ backgroundColor: form.primaryColor }}
        >
          Comandă acum
        </div>
        <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-600">
          <p className="font-black text-slate-950">{form.name}</p>
          {form.address && <p className="mt-1">{form.address}</p>}
          {form.phone && <p className="mt-1">Telefon: {form.phone}</p>}
        </div>
      </div>
    </aside>
  );
}
