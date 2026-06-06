"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import {
  getRestaurantPresence,
  updateRestaurantPresence,
  type RestaurantPresence,
} from "@/services/commercial-service";

export function RestaurantPresencePage() {
  const { profile } = useAuth();
  const [data, setData] = useState<RestaurantPresence | null>(null);
  const [qr, setQr] = useState("");
  const [svg, setSvg] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile?.restaurantId) return;
    void getRestaurantPresence(profile.restaurantId)
      .then(async (presence) => {
        const publicUrl = new URL(
          presence.publicUrl,
          window.location.origin,
        ).toString();
        setData({ ...presence, publicUrl });
        setQr(await QRCode.toDataURL(publicUrl, { width: 700, margin: 2 }));
        setSvg(await QRCode.toString(publicUrl, { type: "svg", margin: 2 }));
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Datele QR si SEO nu au putut fi incarcate.",
        ),
      );
  }, [profile?.restaurantId]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!data) return;
    setError("");
    setMessage("");
    try {
      await updateRestaurantPresence(data.id, data);
      setMessage("Setarile SEO au fost salvate.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Setarile SEO nu au putut fi salvate.",
      );
    }
  };

  const download = (content: string, type: string, filename: string) => {
    const anchor = document.createElement("a");
    anchor.href =
      type === "image/png"
        ? content
        : URL.createObjectURL(new Blob([content], { type }));
    anchor.download = filename;
    anchor.click();
    if (type !== "image/png") URL.revokeObjectURL(anchor.href);
  };

  if (error && !data) {
    return (
      <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
        {error}
      </p>
    );
  }
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader
        eyebrow="Prezenta online"
        title="QR, link public si SEO"
        description="Materialele sunt generate automat pentru pagina publica a restaurantului."
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <section className="rounded-[1.75rem] bg-white p-6 text-center shadow-sm">
          {qr && (
            <Image
              src={qr}
              alt={`QR ${data.name}`}
              width={256}
              height={256}
              unoptimized
              className="mx-auto w-64"
            />
          )}
          <p className="mt-3 break-all text-xs font-bold text-[#7b756f]">
            {data.publicUrl}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => download(qr, "image/png", `${data.slug}-qr.png`)} className="rounded-xl bg-[#ff5a1f] px-4 py-3 text-xs font-black text-white">Descarca PNG</button>
            <button type="button" onClick={() => download(svg, "image/svg+xml", `${data.slug}-qr.svg`)} className="rounded-xl bg-[#171411] px-4 py-3 text-xs font-black text-white">Descarca SVG</button>
          </div>
          <div className="mt-6 rounded-2xl bg-[#171411] p-5 text-white">
            <p className="text-lg font-black">Scaneaza si comanda</p>
            <p className="mt-1 text-xs text-white/60">{data.name}</p>
          </div>
        </section>
        <form onSubmit={save} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Setari SEO</h2>
          <PresenceField label="Titlu SEO" value={data.seoTitle} onChange={(seoTitle) => setData({ ...data, seoTitle })} />
          <label className="mt-4 block text-xs font-black">
            Meta descriere
            <textarea rows={4} value={data.seoDescription} onChange={(event) => setData({ ...data, seoDescription: event.target.value })} className={fieldClass} />
          </label>
          <PresenceField label="Imagine social media (URL)" value={data.socialImageUrl || ""} onChange={(socialImageUrl) => setData({ ...data, socialImageUrl })} />
          {message && <p className="mt-4 text-sm font-bold text-emerald-700">{message}</p>}
          {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}
          <button className="mt-5 rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-black text-white">Salveaza SEO</button>
        </form>
      </div>
    </div>
  );
}

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#e6e0db] bg-[#fcfaf8] px-4 py-3 text-sm outline-none focus:border-[#ff5a1f]";

function PresenceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-4 block text-xs font-black">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}
