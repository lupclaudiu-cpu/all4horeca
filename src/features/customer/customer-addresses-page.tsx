"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { AddressAutocomplete } from "@/features/checkout/address-autocomplete";
import { useAuth } from "@/features/auth/auth-context";
import type { DeliveryLocation } from "@/lib/types";
import {
  deleteDatabaseCustomerAddress,
  getDatabaseCustomerAddresses,
  getLocalCustomerAddresses,
  saveDatabaseCustomerAddress,
  saveLocalCustomerAddresses,
  type SavedCustomerAddress,
} from "@/services/customer-profile-service";

const EMPTY_ADDRESS: SavedCustomerAddress = {
  id: "",
  label: "Acasă",
  address: "",
  isDefault: false,
};

export function CustomerAddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedCustomerAddress[]>([]);
  const [editing, setEditing] = useState<SavedCustomerAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAddresses(getLocalCustomerAddresses());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getDatabaseCustomerAddresses()
      .then((items) => {
        if (!active) return;
        setAddresses(items);
        saveLocalCustomerAddresses(items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const updateAddress = useCallback(
    (address: string, location?: DeliveryLocation) => {
      setEditing((current) =>
        current
          ? {
              ...current,
              address,
              latitude: location?.latitude,
              longitude: location?.longitude,
              placeId: location?.placeId,
            }
          : current,
      );
    },
    [],
  );

  const saveAddress = async () => {
    if (!editing || editing.address.trim().length < 5) {
      setError("Introdu o adresă validă.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let nextAddress = {
        ...editing,
        id: editing.id || `local-${crypto.randomUUID()}`,
        label: editing.label.trim() || "Acasă",
        address: editing.address.trim(),
        isDefault: editing.isDefault || addresses.length === 0,
      };
      if (user) {
        const databaseId = await saveDatabaseCustomerAddress(nextAddress);
        nextAddress = { ...nextAddress, id: databaseId };
      }
      const next = [
        ...addresses.filter((item) => item.id !== editing.id),
        nextAddress,
      ].map((item) => ({
        ...item,
        isDefault: nextAddress.isDefault ?
           item.id === nextAddress.id
          : item.isDefault,
      }));
      setAddresses(next);
      saveLocalCustomerAddresses(next);
      setEditing(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Adresa nu a putut fi salvată.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (address: SavedCustomerAddress) => {
    setError(null);
    try {
      if (user) await deleteDatabaseCustomerAddress(address.id);
      const next = addresses.filter((item) => item.id !== address.id);
      setAddresses(next);
      saveLocalCustomerAddresses(next);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Adresa nu a putut fi ștearsă.",
      );
    }
  };

  const setDefault = async (address: SavedCustomerAddress) => {
    const nextAddress = { ...address, isDefault: true };
    setSaving(true);
    try {
      if (user) await saveDatabaseCustomerAddress(nextAddress);
      const next = addresses.map((item) => ({
        ...item,
        isDefault: item.id === address.id,
      }));
      setAddresses(next);
      saveLocalCustomerAddresses(next);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Adresa implicită nu a putut fi schimbată.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/cont"
              className="grid size-11 place-items-center rounded-full bg-slate-100"
            >
              <ArrowLeftIcon className="size-5" />
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-600">
                Profil client
              </p>
              <h1 className="text-2xl font-black">Adrese salvate</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY_ADDRESS })}
            className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white"
            aria-label="Adaugă adresă"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        {editing && (
          <section className="mb-5 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-black">
              {editing.id ? "Modifică adresa" : "Adresă nouă"}
            </h2>
            <label className="mt-4 block">
              <span className="text-sm font-black">Etichetă</span>
              <input
                value={editing.label}
                onChange={(event) =>
                  setEditing((current) =>
                    current ? { ...current, label: event.target.value } : current,
                  )
                }
                placeholder="Acasă, Birou..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <div className="mt-4">
              <AddressAutocomplete
                value={editing.address}
                location={
                  editing.latitude !== undefined &&
                  editing.longitude !== undefined
                    ? {
                        formattedAddress: editing.address,
                        latitude: editing.latitude,
                        longitude: editing.longitude,
                        placeId: editing.placeId,
                      }
                    : undefined
                }
                onChange={updateAddress}
              />
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(event) =>
                  setEditing((current) =>
                    current ?
                       { ...current, isDefault: event.target.checked }
                      : current,
                  )
                }
                className="size-5 accent-blue-600"
              />
              Folosește implicit la checkout
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black"
              >
                Renunță
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAddress()}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? "Se salvează..." : "Salvează"}
              </button>
            </div>
          </section>
        )}

        {loading ? (
          <div className="h-48 animate-pulse rounded-[2rem] bg-white" />
        ) : addresses.length ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-50 text-blue-600">
                    <MapPinIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-black">{address.label}</h2>
                      {address.isDefault && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">
                          Implicită
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {address.address}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void setDefault(address)}
                      className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800"
                    >
                      Setează implicită
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(address)}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black"
                  >
                    Modifică
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeAddress(address)}
                    className="ml-auto grid size-9 place-items-center rounded-xl bg-red-50 text-red-600"
                    aria-label={`Șterge ${address.label}`}
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY_ADDRESS })}
            className="w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center"
          >
            <MapPinIcon className="mx-auto size-9 text-blue-600" />
            <span className="mt-4 block font-black">Adaugă prima adresă</span>
            <span className="mt-2 block text-sm text-slate-500">
              Va fi completată automat la următoarea comandă.
            </span>
          </button>
        )}
      </div>
    </main>
  );
}
