"use client";

import Image from "next/image";
import { useState } from "react";
import type { RestaurantOnboardingInput } from "@/lib/types";
import {
  createRestaurantWithOwner,
  uploadRestaurantAsset,
} from "@/services/admin-service";

const days = [
  ["L", 1],
  ["Ma", 2],
  ["Mi", 3],
  ["J", 4],
  ["V", 5],
  ["S", 6],
  ["D", 0],
] as const;

const initialData: RestaurantOnboardingInput = {
  name: "",
  slug: "",
  logoUrl: null,
  primaryColor: "#ff5a1f",
  secondaryColor: "#171411",
  address: "",
  phone: "",
  email: "",
  openingTime: "10:00",
  closingTime: "23:30",
  workingDays: [1, 2, 3, 4, 5, 6, 0],
  acceptsDelivery: true,
  acceptsPickup: true,
  acceptsCash: true,
  acceptsCard: true,
  deliveryFee: 10,
  freeDeliveryThreshold: 100,
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
};

export function RestaurantWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof RestaurantOnboardingInput>(
    key: K,
    value: RestaurantOnboardingInput[K],
  ) => setData((current) => ({ ...current, [key]: value }));

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      update("logoUrl", await uploadRestaurantAsset(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload eșuat.");
    } finally {
      setUploading(false);
    }
  };

  const finish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createRestaurantWithOwner({
        ...data,
        slug: normalizeSlug(data.slug || data.name),
      });
      await onCreated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Creare eșuată.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(24,18,12,0.08)]">
      <div className="border-b border-[#eee9e4] p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">
              Pasul {step} din 5
            </p>
            <h2 className="mt-1 text-2xl font-black">Adaugă Restaurant</h2>
          </div>
          <button onClick={onClose} className="text-xs font-black text-[#8b8580]">
            Închide
          </button>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${item <= step ? "bg-[#ff5a1f]" : "bg-[#eee9e4]"}`}
            />
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {step === 1 && (
          <WizardGrid>
            <WizardField label="Nume restaurant" value={data.name} onChange={(value) => {
              update("name", value);
              if (!data.slug) update("slug", normalizeSlug(value));
            }} />
            <WizardField label="Slug public" value={data.slug} onChange={(value) => update("slug", normalizeSlug(value))} />
            <label className="sm:col-span-2">
              <span className="text-sm font-black">Logo restaurant</span>
              <div className="mt-2 flex items-center gap-4 rounded-2xl border border-dashed border-[#d9d2cc] p-4">
                {data.logoUrl ? (
                  <div className="relative size-20 overflow-hidden rounded-xl">
                    <Image src={data.logoUrl} alt="Logo" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="grid size-20 place-items-center rounded-xl bg-[#f5f2ef] text-xs font-black text-[#8b8580]">
                    LOGO
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) => void uploadLogo(event.target.files?.[0])}
                  className="text-xs"
                />
              </div>
            </label>
            <ColorField label="Culoare principală" value={data.primaryColor} onChange={(value) => update("primaryColor", value)} />
            <ColorField label="Culoare secundară" value={data.secondaryColor} onChange={(value) => update("secondaryColor", value)} />
          </WizardGrid>
        )}

        {step === 2 && (
          <WizardGrid>
            <div className="sm:col-span-2"><WizardField label="Adresă" value={data.address} onChange={(value) => update("address", value)} /></div>
            <WizardField label="Telefon" value={data.phone} onChange={(value) => update("phone", value)} type="tel" />
            <WizardField label="Email restaurant" value={data.email} onChange={(value) => update("email", value)} type="email" />
          </WizardGrid>
        )}

        {step === 3 && (
          <WizardGrid>
            <WizardField label="Oră deschidere" value={data.openingTime} onChange={(value) => update("openingTime", value)} type="time" />
            <WizardField label="Oră închidere" value={data.closingTime} onChange={(value) => update("closingTime", value)} type="time" />
            <div className="sm:col-span-2">
              <p className="text-sm font-black">Zile lucrătoare</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {days.map(([label, value]) => {
                  const active = data.workingDays.includes(value);
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() =>
                        update(
                          "workingDays",
                          active
                            ? data.workingDays.filter((day) => day !== value)
                            : [...data.workingDays, value],
                        )
                      }
                      className={`grid size-11 place-items-center rounded-xl text-xs font-black ${active ? "bg-[#ff5a1f] text-white" : "bg-[#f5f2ef] text-[#7a746e]"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </WizardGrid>
        )}

        {step === 4 && (
          <WizardGrid>
            <WizardToggle label="Livrare activă" checked={data.acceptsDelivery} onChange={(value) => update("acceptsDelivery", value)} />
            <WizardToggle label="Ridicare activă" checked={data.acceptsPickup} onChange={(value) => update("acceptsPickup", value)} />
            <WizardToggle label="Cash activ" checked={data.acceptsCash} onChange={(value) => update("acceptsCash", value)} />
            <WizardToggle label="Card activ" checked={data.acceptsCard} onChange={(value) => update("acceptsCard", value)} />
          </WizardGrid>
        )}

        {step === 5 && (
          <WizardGrid>
            <WizardField label="Taxă livrare" value={String(data.deliveryFee)} onChange={(value) => update("deliveryFee", Number(value))} type="number" />
            <WizardField label="Prag livrare gratuită" value={String(data.freeDeliveryThreshold)} onChange={(value) => update("freeDeliveryThreshold", Number(value))} type="number" />
            <div className="sm:col-span-2 mt-3 border-t border-[#eee9e4] pt-5">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff5a1f]">Cont Restaurant Owner</p>
            </div>
            <WizardField label="Nume owner" value={data.ownerName} onChange={(value) => update("ownerName", value)} />
            <WizardField label="Email owner" value={data.ownerEmail} onChange={(value) => update("ownerEmail", value)} type="email" />
            <div className="sm:col-span-2"><WizardField label="Parolă temporară" value={data.ownerPassword} onChange={(value) => update("ownerPassword", value)} type="password" /></div>
          </WizardGrid>
        )}

        {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

        <div className="mt-6 flex justify-between gap-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((current) => current - 1)}
            className="rounded-xl bg-[#f3f0ed] px-5 py-3 text-xs font-black disabled:opacity-30"
          >
            Înapoi
          </button>
          {step < 5 ? (
            <button type="button" onClick={() => setStep((current) => current + 1)} className="rounded-xl bg-[#171411] px-5 py-3 text-xs font-black text-white">
              Continuă
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || data.ownerPassword.length < 8}
              onClick={() => void finish()}
              className="rounded-xl bg-[#ff5a1f] px-5 py-3 text-xs font-black text-white disabled:opacity-50"
            >
              {submitting ? "Se creează..." : "Creează restaurantul"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function WizardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function WizardField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
}) {
  return <label className="block"><span className="text-sm font-black">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e6e0db] bg-[#fcfaf8] px-4 py-3 text-sm outline-none focus:border-[#ff5a1f]" /></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="text-sm font-black">{label}</span><div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e6e0db] p-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-10 rounded-lg" /><span className="text-xs font-bold">{value}</span></div></label>;
}

function WizardToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between rounded-xl border border-[#eee9e4] p-4"><span className="text-sm font-black">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-[#ff5a1f]" /></label>;
}

function normalizeSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
