"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { OwnerSelfRegistrationInput } from "@/lib/types";

const initialData: OwnerSelfRegistrationInput = {
  contactName: "",
  phone: "",
  email: "",
  restaurantName: "",
  companyName: "",
  vatCui: "",
  city: "",
  address: "",
  password: "",
  confirmPassword: "",
};

const OWNER_REGISTER_DRAFT_KEY = "all4horeca-owner-register-draft";

type RegisterResult = {
  clientUrl: string;
  dashboardUrl: string;
  trialExpiresAt: string;
};

export function OwnerRegistrationPage() {
  const [data, setData] = useState(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterResult | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = window.sessionStorage.getItem(OWNER_REGISTER_DRAFT_KEY);
        if (draft) {
          setData({ ...initialData, ...JSON.parse(draft) });
        }
      } catch {
        window.sessionStorage.removeItem(OWNER_REGISTER_DRAFT_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = <K extends keyof OwnerSelfRegistrationInput>(
    key: K,
    value: OwnerSelfRegistrationInput[K],
  ) =>
    setData((current) => {
      const next = { ...current, [key]: value };
      window.sessionStorage.setItem(
        OWNER_REGISTER_DRAFT_KEY,
        JSON.stringify(next),
      );
      return next;
    });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/owner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as RegisterResult & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Contul restaurant nu a putut fi creat.");
      }
      setResult(payload);
      window.sessionStorage.removeItem(OWNER_REGISTER_DRAFT_KEY);
      setData(initialData);
    } catch (reason) {
      setError(
        reason instanceof Error ?
           reason.message
          : "Contul restaurant nu a putut fi creat.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="antoria-gradient p-7 text-white sm:p-10">
          <Link href="/login" className="text-xl font-black">
            ALL4HORECA
          </Link>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            by ANTORIA
          </p>
          <h1 className="mt-16 text-4xl font-black tracking-[-0.06em]">
            Creează cont restaurant cu 7 zile gratuite.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Primești automat meniu demo, panou de control, link public și
            perioadă de testare. După perioada gratuită, datele rămân păstrate.
          </p>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Înregistrare restaurant
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            Date restaurant
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nume persoană de contact" value={data.contactName} onChange={(value) => update("contactName", value)} />
            <Field label="Telefon" value={data.phone} onChange={(value) => update("phone", value)} type="tel" />
            <Field label="Email" value={data.email} onChange={(value) => update("email", value)} type="email" />
            <Field label="Nume restaurant" value={data.restaurantName} onChange={(value) => update("restaurantName", value)} />
            <Field label="Nume firmă" value={data.companyName} onChange={(value) => update("companyName", value)} />
            <Field label="CUI / Cod fiscal" value={data.vatCui} onChange={(value) => update("vatCui", value)} />
            <Field label="Oraș" value={data.city} onChange={(value) => update("city", value)} />
            <Field label="Adresă" value={data.address} onChange={(value) => update("address", value)} />
            <Field label="Parolă" value={data.password} onChange={(value) => update("password", value)} type="password" />
            <Field label="Confirmă parola" value={data.confirmPassword} onChange={(value) => update("confirmPassword", value)} type="password" />
          </div>

          {error && (
            <p className="mt-5 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
          {result && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
              <p>
                Contul a fost creat. Perioada gratuită este activă până la{" "}
                {new Date(result.trialExpiresAt).toLocaleDateString("ro-RO")}.
              </p>
              <Link href="/login" className="mt-3 inline-block text-blue-700">
                Intră în panoul de control
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
          >
            {submitting ? "Se creează..." : "Creează cont restaurant"}
          </button>
          <Link
            href="/login"
            className="mt-4 block text-center text-xs font-black text-slate-500"
          >
            Ai deja cont Autentifică-te
          </Link>
        </form>
      </section>
    </main>
  );
}

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
      <span className="text-sm font-black">{label}</span>
      <input
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}
