"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/data/restaurant";
import type { AdminRestaurantDetails } from "@/lib/types";
import { getAdminRestaurantDetails } from "@/services/admin-service";

export function RestaurantDetailsPage({ restaurantId }: { restaurantId: string }) {
  const [data, setData] = useState<AdminRestaurantDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getAdminRestaurantDetails(restaurantId)
      .then(setData)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Restaurantul nu a putut fi incarcat.",
        ),
      );
  }, [restaurantId]);

  if (error) {
    return <p className="rounded-2xl bg-red-50 p-5 font-bold text-red-700">{error}</p>;
  }
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/admin" className="text-xs font-black text-[#ff5a1f]">
        Inapoi la restaurante
      </Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">
            Restaurant
          </p>
          <h1 className="mt-1 text-4xl font-black">{data.name}</h1>
          <p className="mt-2 text-sm text-[#746e68]">
            {data.address || "Adresa necompletata"} · {data.phone || "Telefon necompletat"}
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-black ${data.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          {data.isActive ? "Activ" : "Inactiv"}
        </span>
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <LinkCard label="Aplicatie client" href={data.clientUrl} />
        <LinkCard label="Dashboard restaurant" href={data.dashboardUrl} />
        <LinkCard label="QR code" href={data.qrUrl} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <DetailList title={`Categorii (${data.categories.length})`}>
          {data.categories.map((category) => (
            <Row key={category.id} title={category.name} detail={category.active ? "Activa" : "Inactiva"} />
          ))}
        </DetailList>
        <DetailList title={`Produse (${data.products.length})`}>
          {data.products.map((product) => (
            <Row
              key={product.id}
              title={product.name}
              detail={`${product.categoryName} · ${formatPrice(product.price)} · ${product.soldOut ? "Epuizat" : product.active ? "Activ" : "Inactiv"}`}
            />
          ))}
        </DetailList>
        <DetailList title={`Comenzi (${data.orders.length})`}>
          {data.orders.map((order) => (
            <Row key={order.id} title={order.orderNumber} detail={`${formatPrice(order.total)} · ${order.status}`} />
          ))}
        </DetailList>
        <DetailList title={`Utilizatori (${data.users.length})`}>
          {data.users.map((user) => (
            <Row key={user.id} title={user.fullName || user.email} detail={`${user.email} · ${user.role}`} />
          ))}
        </DetailList>
      </section>
    </div>
  );
}

function LinkCard({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-[#171411] p-5 text-white">
      <p className="text-xs font-bold text-white/50">{label}</p>
      <p className="mt-2 break-all text-sm font-black">{href}</p>
    </Link>
  );
}

function DetailList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
      <h2 className="border-b border-[#eee9e4] p-5 text-xl font-black">{title}</h2>
      <div className="divide-y divide-[#eee9e4]">
        {children || <p className="p-5 text-sm text-[#817a74]">Nu exista date.</p>}
      </div>
    </section>
  );
}

function Row({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="p-4">
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs text-[#817a74]">{detail}</p>
    </div>
  );
}
