"use client";

import { PhoneIcon, UserIcon } from "@/components/icons";
import { formatPrice } from "@/data/restaurant";
import { formatDashboardDate } from "@/features/dashboard/dashboard-utils";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { useOrders } from "@/features/orders/order-context";
import { addMoney } from "@/lib/money";

type CustomerSummary = {
  name: string;
  phone: string;
  orderCount: number;
  totalValue: number;
  lastOrder: string;
};

export function CustomersPage() {
  const { orders, hydrated } = useOrders();
  const customers = aggregateCustomers(orders);

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Relații"
        title="Clienți"
        description="Vezi clienții grupați după numărul de telefon și valoarea lor pentru restaurant."
        action={
          <span className="w-fit rounded-full bg-violet-100 px-3 py-2 text-xs font-black text-violet-700">
            {customers.length} clienți
          </span>
        }
      />

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!hydrated ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-[1.75rem] bg-white"
            />
          ))
        ) : customers.length ? (
          customers.map((customer) => (
            <article
              key={customer.phone}
              className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <UserIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black">{customer.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#64748b]">
                    <PhoneIcon className="size-3.5" />
                    {customer.phone}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <CustomerMetric
                  label="Comenzi"
                  value={String(customer.orderCount)}
                />
                <CustomerMetric
                  label="Valoare totală"
                  value={formatPrice(customer.totalValue)}
                />
              </div>
              <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#64748b]">
                  Ultima comandă
                </p>
                <p className="mt-1 text-xs font-bold">
                  {formatDashboardDate(customer.lastOrder)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full grid min-h-[50vh] place-items-center rounded-[2rem] border border-dashed border-black/10 bg-white text-center">
            <div>
              <UserIcon className="mx-auto size-12 text-[#c5bfb9]" />
              <h2 className="mt-4 text-xl font-black">Nu există clienți încă</h2>
              <p className="mt-2 text-sm text-[#64748b]">
                Clienții vor apărea după plasarea comenzilor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function aggregateCustomers(
  orders: ReturnType<typeof useOrders>["orders"],
): CustomerSummary[] {
  const customers = new Map<string, CustomerSummary>();

  orders.forEach((order) => {
    const current = customers.get(order.customer.phone);
    if (!current) {
      customers.set(order.customer.phone, {
        name: order.customer.name,
        phone: order.customer.phone,
        orderCount: 1,
        totalValue: order.status === "Anulată" ? 0 : order.total,
        lastOrder: order.createdAt,
      });
      return;
    }

    current.orderCount += 1;
    if (order.status !== "Anulată") {
      current.totalValue = addMoney(current.totalValue, order.total);
    }
    if (new Date(order.createdAt) > new Date(current.lastOrder)) {
      current.lastOrder = order.createdAt;
      current.name = order.customer.name;
    }
  });

  return [...customers.values()].sort(
    (a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime(),
  );
}

function CustomerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8fafc] p-3">
      <p className="text-[10px] font-bold text-[#64748b]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
