"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

/**
 * Customer sign-in: phone number + one SMS code (only on a new device).
 * No password, no other data.
 */
export function PhoneLogin({ onDone }: { onDone?: () => void }) {
  const { requestPhoneCode, verifyPhoneCode } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[0-9+\s().-]{9,16}$/.test(phone.trim())) {
      setError("Introdu un număr de telefon valid.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestPhoneCode(phone);
      setStep("code");
    } catch {
      setError("Nu am putut trimite codul. Încearcă din nou în câteva minute.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyPhoneCode(phone, code);
      onDone?.();
    } catch {
      setError("Cod greșit sau expirat. Verifică SMS-ul și încearcă din nou.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={step === "phone" ? sendCode : confirmCode}
      className="space-y-4 rounded-2xl border border-black/10 bg-white p-5"
    >
      <h2 className="text-lg font-black">
        {step === "phone" ? "Introdu numărul tău de telefon" : "Introdu codul din SMS"}
      </h2>
      <p className="text-sm text-black/60">
        {step === "phone" ?
          "Ca să plasezi comanda ai nevoie de un cont. Doar numărul de telefon, fără parolă."
        : `Am trimis un cod de 6 cifre la ${phone}.`}
      </p>
      {step === "phone" ?
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="07xx xxx xxx"
          aria-label="Număr de telefon"
          className="w-full rounded-xl border border-black/20 px-4 py-3 text-base"
        />
      : <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          aria-label="Cod din SMS"
          className="w-full rounded-xl border border-black/20 px-4 py-3 text-center text-2xl tracking-[0.5em]"
        />
      }
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-black px-4 py-3 font-black text-white disabled:opacity-50"
      >
        {busy ? "Se procesează…" : step === "phone" ? "Trimite codul" : "Confirmă"}
      </button>
      {step === "code" && (
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError(null);
          }}
          className="w-full text-sm font-semibold underline"
        >
          Schimbă numărul
        </button>
      )}
    </form>
  );
}
