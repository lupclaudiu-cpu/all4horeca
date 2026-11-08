"use client";

import { type FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function StaffManager() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/owner/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ name, email, password }),
    });
    const result = (await response.json()) as { error?: string };
    if (response.ok) {
      setMessage("Cont creat. Personalul se autentifică cu acest email și parolă și vede doar pagina Locație.");
      setName(""); setEmail(""); setPassword("");
    } else {
      setMessage(result.error ?? "Contul nu a putut fi creat.");
    }
    setBusy(false);
  };

  return (
    <section className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Cont pentru personalul din locație</h2>
      <p className="text-xs text-slate-600">Vede comenzile, le acceptă și marchează produse epuizate. Nu vede statistici și nu schimbă meniul.</p>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-3">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
        <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă (min. 8)" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
        <button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50 sm:col-span-3">Creează cont personal</button>
      </form>
      {message && <p role="status" className="mt-2 text-sm font-bold text-slate-800">{message}</p>}
    </section>
  );
}
