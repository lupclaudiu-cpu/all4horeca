"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function PasswordResetPage({ mode }: { mode: "request" | "update" }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <div className="antoria-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <Link href="/login" className="text-lg font-black">
          ALL4HORECA
        </Link>
        {mode === "request" ? <RequestForm /> : <UpdateForm />}
      </div>
    </main>
  );
}

function RequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Serviciul de autentificare nu este disponibil.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/resetare-parola` },
    );
    setSubmitting(false);
    if (resetError) {
      setError("Nu am putut trimite emailul. Încearcă din nou peste câteva minute.");
      return;
    }
    setSent(true);
  };

  return (
    <form onSubmit={submit}>
      <h1 className="mt-8 text-3xl font-black tracking-[-0.05em]">
        Ai uitat parola?
      </h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">
        Scrie emailul contului și îți trimitem un link pentru parola nouă.
      </p>
      {sent ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Dacă există un cont cu acest email, ai primit un link de resetare.
          Deschide-l de pe același telefon sau computer.
        </p>
      ) : (
        <>
          <label className="block">
            <span className="text-sm font-black">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {submitting ? "Se trimite..." : "Trimite link de resetare"}
          </button>
        </>
      )}
      <Link
        href="/login"
        className="mt-4 block text-center text-sm font-black text-blue-600"
      >
        Înapoi la autentificare
      </Link>
    </form>
  );
}

function UpdateForm() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = window.setTimeout(() => setChecked(true), 0);
      return () => window.clearTimeout(timer);
    }
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecked(true);
      }
    });

    const init = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) setReady(true);
      setChecked(true);
    };
    // Lăsăm clientul să proceseze eventualul token din adresă înainte de verificare.
    const timer = window.setTimeout(() => void init(), 400);

    return () => {
      active = false;
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    if (password !== confirm) {
      setError("Parolele nu coincid.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError("Parola nu a putut fi schimbată. Cere un link nou și încearcă din nou.");
      return;
    }
    setDone(true);
  };

  if (!checked) {
    return <p className="mt-8 text-sm text-slate-500">Se verifică linkul...</p>;
  }

  if (done) {
    return (
      <div>
        <h1 className="mt-8 text-3xl font-black tracking-[-0.05em]">
          Parola a fost schimbată
        </h1>
        <Link
          href="/login"
          className="mt-6 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white"
        >
          Intră în cont
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div>
        <h1 className="mt-8 text-3xl font-black tracking-[-0.05em]">
          Link invalid sau expirat
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Cere un link nou de resetare.
        </p>
        <Link
          href="/parola-uitata"
          className="mt-6 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white"
        >
          Cere link nou
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h1 className="mt-8 text-3xl font-black tracking-[-0.05em]">
        Alege parola nouă
      </h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">
        Cel puțin 8 caractere.
      </p>
      <div className="space-y-4">
        {[
          { label: "Parolă nouă", value: password, set: setPassword },
          { label: "Repetă parola", value: confirm, set: setConfirm },
        ].map((field) => (
          <label key={field.label} className="block">
            <span className="text-sm font-black">{field.label}</span>
            <input
              type="password"
              value={field.value}
              onChange={(event) => field.set(event.target.value)}
              autoComplete="new-password"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
      >
        {submitting ? "Se salvează..." : "Salvează parola"}
      </button>
    </form>
  );
}
