"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { useAuth } from "@/features/auth/auth-context";
import {
  getDatabaseCustomerProfile,
  getLocalCustomerProfile,
  saveDatabaseCustomerProfile,
  saveLocalCustomerProfile,
  type SavedCustomerProfile,
} from "@/services/customer-profile-service";

const EMPTY_PROFILE: SavedCustomerProfile = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export function CustomerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localProfile = getLocalCustomerProfile();
      if (localProfile) setProfile(localProfile);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    let active = true;
    void getDatabaseCustomerProfile()
      .then((databaseProfile) => {
        if (!active || !databaseProfile) return;
        setProfile(databaseProfile);
        saveLocalCustomerProfile(databaseProfile);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setError(null);
    if (profile.phone.trim().length < 8) {
      setError("Completează un număr de telefon valid.");
      return;
    }

    setSaving(true);
    const normalized = {
      ...profile,
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
    };
    try {
      saveLocalCustomerProfile(normalized);
      if (user) {
        await saveDatabaseCustomerProfile({
          ...normalized,
          name: normalized.name || "Client",
        });
      }
      setProfile(normalized);
      setNotice(
        user ?
           "Datele au fost salvate și sincronizate."
          : "Datele au fost salvate pe acest dispozitiv.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Datele nu au putut fi salvate.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
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
            <h1 className="text-2xl font-black">Date personale</h1>
          </div>
        </div>
      </header>

      <form
        onSubmit={submit}
        className="mx-auto mt-6 max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {loading ? (
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        ) : (
          <>
            <div className="space-y-4">
              <ProfileField
                label="Nume opțional"
                value={profile.name}
                onChange={(name) => setProfile((current) => ({ ...current, name }))}
                autoComplete="name"
              />
              <ProfileField
                label="Telefon"
                value={profile.phone}
                onChange={(phone) =>
                  setProfile((current) => ({ ...current, phone }))
                }
                autoComplete="tel"
                inputMode="tel"
              />
              <ProfileField
                label="Email opțional"
                value={profile.email}
                onChange={(email) =>
                  setProfile((current) => ({ ...current, email }))
                }
                autoComplete="email"
                inputMode="email"
              />
            </div>
            {!user && (
              <p className="mt-5 rounded-xl bg-cyan-50 px-4 py-3 text-xs font-bold text-cyan-800">
                Profilul local completează automat checkout-ul. Autentifică-te
                pentru sincronizare în Supabase.
              </p>
            )}
            {notice && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {notice}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? "Se salvează..." : "Salvează datele"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  inputMode?: "tel" | "email";
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}
