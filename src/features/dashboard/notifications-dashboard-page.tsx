"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { getSupabaseClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  title: string;
  body: string;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
};

export function NotificationsDashboardPage() {
  const { currentRestaurant } = useRestaurant();
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentRestaurant) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const [subscriptionsResult, campaignsResult] = await Promise.all([
      supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", currentRestaurant.id)
        .eq("active", true),
      supabase
        .from("notification_campaigns")
        .select(
          "id, title, body, delivered_count, failed_count, created_at",
        )
        .eq("restaurant_id", currentRestaurant.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setSubscriberCount(subscriptionsResult.count ?? 0);
    setCampaigns(
      (campaignsResult.data ?? []).map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        body: campaign.body,
        deliveredCount: campaign.delivered_count,
        failedCount: campaign.failed_count,
        createdAt: campaign.created_at,
      })),
    );
  }, [currentRestaurant]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentRestaurant) return;
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: currentRestaurant.id,
          title,
          body,
          url: url || `/clienti/${currentRestaurant.slug}`,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        deliveredCount?: number;
        failedCount?: number;
      };
      if (!response.ok) throw new Error(result.error || "Trimiterea a eșuat.");
      setMessage(
        `Notificare trimisă: ${result.deliveredCount ?? 0} livrate, ${
          result.failedCount ?? 0
        } eșuate.`,
      );
      setTitle("");
      setBody("");
      await load();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Trimiterea a eșuat.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader
        eyebrow="Engagement"
        title="Notificări clienți"
        description="Trimite oferte și anunțuri clienților abonați la restaurant."
        action={
          <span className="rounded-full bg-cyan-100 px-3 py-2 text-xs font-black text-cyan-800">
            {subscriberCount} abonați
          </span>
        }
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <form
          onSubmit={submit}
          className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-xl font-black">Broadcast nou</h2>
          <label className="mt-5 block">
            <span className="text-xs font-black">Titlu</span>
            <input
              value={title}
              maxLength={80}
              required
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="Ex: Oferta serii"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-black">Mesaj</span>
            <textarea
              value={body}
              maxLength={240}
              required
              rows={4}
              onChange={(event) => setBody(event.target.value)}
              className={inputClass}
              placeholder="Scrie mesajul pentru clienți..."
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-black">Link la deschidere</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className={inputClass}
              placeholder={`/clienti/${currentRestaurant?.slug ?? "restaurant"}`}
            />
          </label>
          <button
            disabled={sending || !subscriberCount}
            className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {sending ? "Se trimite..." : "Trimite notificarea"}
          </button>
          {!subscriberCount && (
            <p className="mt-3 text-center text-xs font-bold text-slate-500">
              Nu există încă abonați pentru acest restaurant.
            </p>
          )}
          {message && (
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-800">
              {message}
            </p>
          )}
        </form>

        <section className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">Ultimele trimiteri</h2>
          <div className="mt-5 divide-y divide-slate-200">
            {campaigns.length ? (
              campaigns.map((campaign) => (
                <article key={campaign.id} className="py-4 first:pt-0">
                  <p className="font-black">{campaign.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {campaign.body}
                  </p>
                  <p className="mt-2 text-[11px] font-bold text-slate-400">
                    {formatDate(campaign.createdAt)} ·{" "}
                    {campaign.deliveredCount} livrate · {campaign.failedCount}{" "}
                    eșuate
                  </p>
                </article>
              ))
            ) : (
              <p className="py-12 text-center text-sm font-bold text-slate-500">
                Nu există campanii trimise.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
