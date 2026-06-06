"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "login") {
        const profile = await signIn(email.trim(), password);
        router.replace(
          profile.role === "super_admin"
            ? "/admin"
            : profile.role === "restaurant_owner"
              ? "/restaurant/dashboard"
              : "/",
        );
      } else {
        const result = await signUp(fullName.trim(), email.trim(), password);
        if (result.requiresEmailConfirmation) {
          setMessage("Verifică emailul pentru confirmarea contului.");
        } else {
          router.replace("/");
        }
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? translateAuthError(reason.message)
          : "Operațiunea nu a putut fi finalizată.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <main className="grid min-h-screen bg-[#f8f5f2] lg:grid-cols-2">
      <section className="hidden bg-[#171411] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-xl font-black">ALL4HORECA</Link>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ff5a1f]">
            Platformă HORECA
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-black tracking-[-0.06em]">
            Comenzi, restaurant și administrare într-un singur loc.
          </h1>
        </div>
        <p className="text-sm text-white/40">ALL4HORECA · acces securizat</p>
      </section>

      <section className="grid place-items-center px-5 py-10">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(26,18,12,0.08)] sm:p-8"
        >
          <Link href="/" className="text-lg font-black lg:hidden">ALL4HORECA</Link>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f] lg:mt-0">
            {isLogin ? "Bine ai revenit" : "Cont client"}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            {isLogin ? "Autentificare" : "Creează cont"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#7a746e]">
            {isLogin
              ? "Accesul se adaptează automat rolului contului."
              : "Înregistrarea publică creează un cont de client final."}
          </p>

          <div className="mt-7 space-y-4">
            {!isLogin && (
              <AuthField
                label="Nume complet"
                value={fullName}
                onChange={setFullName}
                type="text"
                autoComplete="name"
              />
            )}
            <AuthField
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            <AuthField
              label="Parolă"
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && <Notice text={error} tone="error" />}
          {message && <Notice text={message} tone="success" />}

          <button
            type="submit"
            disabled={
              submitting ||
              !email.trim() ||
              password.length < 6 ||
              (!isLogin && fullName.trim().length < 2)
            }
            className="mt-6 w-full rounded-2xl bg-[#ff5a1f] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {submitting
              ? "Se procesează..."
              : isLogin
                ? "Intră în cont"
                : "Creează cont"}
          </button>

          <p className="mt-5 text-center text-sm text-[#7a746e]">
            {isLogin ? "Nu ai cont?" : "Ai deja cont?"}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-black text-[#ff5a1f]"
            >
              {isLogin ? "Înregistrează-te" : "Autentifică-te"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function AuthField({
  label,
  value,
  onChange,
  type,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-2 w-full rounded-2xl border border-[#e6e0db] bg-[#fcfaf8] px-4 py-3 text-sm outline-none focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10"
      />
    </label>
  );
}

function Notice({
  text,
  tone,
}: {
  text: string;
  tone: "error" | "success";
}) {
  return (
    <p
      className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
        tone === "error"
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {text}
    </p>
  );
}

function translateAuthError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "Email sau parolă incorectă.";
  }
  if (message.includes("User already registered")) {
    return "Există deja un cont cu acest email.";
  }
  if (message.includes("Email not confirmed")) {
    return "Contul nu este confirmat. Pentru MVP, aplica ultima migrare Supabase.";
  }
  return message;
}
