"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  getLocalCustomerProfile,
  saveLocalCustomerProfile,
} from "@/services/customer-profile-service";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  return mode === "login" ? <StaffLogin /> : <ClientRegister />;
}

function StaffLogin() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const profile = await signIn(email.trim(), password);
      if (profile.role === "super_admin") {
        router.replace("/admin");
      } else if (profile.role === "restaurant_owner") {
        router.replace("/restaurant/dashboard");
      } else {
        router.replace("/");
      }
    } catch (reason) {
      setError(
        reason instanceof Error ?
           translateAuthError(reason.message)
          : "Autentificarea nu a putut fi finalizată.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Acces profesional"
      title="Proprietar restaurant / Administrator"
      description="Autentificare securizată cu email și parolă pentru administrarea platformei."
    >
      <form onSubmit={submit}>
        <div className="space-y-4">
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
            autoComplete="current-password"
          />
        </div>
        {error && <Notice text={error} />}
        <button
          type="submit"
          disabled={submitting || !email.trim() || password.length < 6}
          className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {submitting ? "Se autentifică..." : "Intră în dashboard"}
        </button>
        <Link
          href="/owner/register"
          className="mt-3 block rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center text-sm font-black text-blue-700 transition hover:bg-blue-100"
        >
          Creeaz cont restaurant
        </Link>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Clienții pot accesa meniul și plasa comenzi fără autentificare.
        </p>
        <Link
          href="/"
          className="mt-3 block text-center text-sm font-black text-blue-600"
        >
          Deschide meniul restaurantului
        </Link>
      </form>
    </AuthLayout>
  );
}

function ClientRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const profile = getLocalCustomerProfile();
      setName(profile?.name ?? "");
      setPhone(profile?.phone ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[0-9+\s()-]{8,16}$/.test(phone.trim())) {
      setError("Introdu un număr de telefon valid.");
      return;
    }
    saveLocalCustomerProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: getLocalCustomerProfile()?.email ?? "",
      address: getLocalCustomerProfile()?.address ?? "",
    });
    router.replace("/cont");
  };

  return (
    <AuthLayout
      eyebrow="Profil client local"
      title="Finalizare mai rapid?"
      description="Salvează telefonul și, opțional, numele. Nu este necesar email, parolă sau cod SMS."
    >
      <form onSubmit={submit}>
        <div className="space-y-4">
          <AuthField
            label="Telefon"
            value={phone}
            onChange={setPhone}
            type="tel"
            autoComplete="tel"
          />
          <AuthField
            label="Nume opțional"
            value={name}
            onChange={setName}
            type="text"
            autoComplete="name"
            required={false}
          />
        </div>
        {error && <Notice text={error} />}
        <button
          type="submit"
          disabled={phone.trim().length < 8}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          Salvează profilul client
        </button>
        <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
          Datele sunt păstrate local și completează automat checkout-ul.
        </p>
        {/* TODO: Enable Phone OTP only after the launch SMS provider is configured. */}
        <Link
          href="/login"
          className="mt-4 block text-center text-xs font-black text-slate-600"
        >
          Acces owner / administrator
        </Link>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="antoria-gradient hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-xl font-black">
          ALL4HORECA
        </Link>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
            by ANTORIA
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-black tracking-[-0.06em]">
            Comenzi publice și administrare profesională, fără fluxuri amestecate.
          </h1>
        </div>
        <p className="text-sm text-white/40">ALL4HORECA by ANTORIA · acces securizat</p>
      </section>

      <section className="grid place-items-center px-5 py-10">
        <div className="antoria-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
          <Link href="/" className="text-lg font-black lg:hidden">
            ALL4HORECA
          </Link>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-cyan-600 lg:mt-0">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            {title}
          </h1>
          <p className="mb-7 mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
          {children}
        </div>
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  autoComplete: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {text}
    </p>
  );
}

function translateAuthError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "Email sau parolă incorectă.";
  }
  if (message.includes("Email not confirmed")) {
    return "Contul profesional nu este confirmat.";
  }
  return message;
}
