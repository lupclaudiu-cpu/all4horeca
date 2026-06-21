"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/restaurant";
import { useCatalog } from "@/features/catalog/catalog-context";
import { buildDashboardAnalytics } from "@/features/dashboard/dashboard-analytics";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import {
  exportReportCsv,
  exportReportXlsx,
  type ReportExportRow,
} from "@/features/dashboard/reports-export";
import { useOrders } from "@/features/orders/order-context";

type ReportType =
  | "sales"
  | "products"
  | "categories"
  | "customers"
  | "operational";

type PeriodId =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "currentMonth"
  | "previousMonth"
  | "currentYear"
  | "custom";

const reportTabs: Array<{ id: ReportType; label: string }> = [
  { id: "sales", label: "Vânzări" },
  { id: "products", label: "Produse" },
  { id: "categories", label: "Categorii" },
  { id: "customers", label: "Clienți" },
  { id: "operational", label: "Operațional" },
];

export function ReportsPage() {
  const { orders, hydrated } = useOrders();
  const { products, categories } = useCatalog();
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [period, setPeriod] = useState<PeriodId>("last30");
  const [clientReady, setClientReady] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const today = startOfDay(new Date());
      setCustomStart(toInputDate(addDays(today, -29)));
      setCustomEnd(toInputDate(today));
      setClientReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const range = useMemo(
    () =>
      clientReady ?
         resolvePeriodRange(period, customStart, customEnd)
        : {
            start: new Date(2000, 0, 1),
            end: new Date(2000, 0, 2),
          },
    [clientReady, customEnd, customStart, period],
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= range.start && createdAt < range.end;
      }),
    [orders, range],
  );
  const analytics = useMemo(
    () =>
      buildDashboardAnalytics(filteredOrders, products, categories, { range }),
    [categories, filteredOrders, products, range],
  );
  const exportRows = buildExportRows(reportType, analytics);
  const filename = `antoria-${reportType}-${toInputDate(range.start)}-${toInputDate(addDays(range.end, -1))}`;

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader
        eyebrow="Business intelligence"
        title="Rapoarte"
        description="Analizează vânzările, produsele, categoriile, clienții și performanța operațională."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!exportRows.length}
              onClick={() => exportReportCsv(filename, exportRows)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-black text-blue-700 disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              type="button"
              disabled={!exportRows.length}
              onClick={() =>
                exportReportXlsx(
                  filename,
                  reportTabs.find((tab) => tab.id === reportType)?.label ??
                    "Raport",
                  exportRows,
                )
              }
              className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white disabled:opacity-40"
            >
              Export Excel
            </button>
          </div>
        }
      />

      {clientReady && <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        range={range}
      />}

      <div className="mt-7 overflow-x-auto">
        <div className="flex w-max gap-2 rounded-2xl bg-white p-2 shadow-sm">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`rounded-xl px-4 py-3 text-xs font-black transition ${
                reportType === tab.id ?
                   "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!hydrated || !clientReady ? (
        <div className="mt-6 h-96 animate-pulse rounded-[1.75rem] bg-white" />
      ) : (
        <ReportContent type={reportType} analytics={analytics} />
      )}
    </div>
  );
}

function PeriodSelector({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  range,
}: {
  period: PeriodId;
  onPeriodChange: (period: PeriodId) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  range: { start: Date; end: Date };
}) {
  const filters: Array<{ id: PeriodId; label: string }> = [
    { id: "today", label: "Azi" },
    { id: "yesterday", label: "Ieri" },
    { id: "last7", label: "Ultimele 7 zile" },
    { id: "last30", label: "Ultimele 30 zile" },
    { id: "currentMonth", label: "Luna curentă" },
    { id: "previousMonth", label: "Luna anterioară" },
    { id: "currentYear", label: "An curent" },
  ];
  return (
    <section className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onPeriodChange(filter.id)}
            className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${
              period === filter.id ?
                 "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-cyan-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPeriodChange("custom")}
          className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${
            period === "custom" ?
               "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          Interval personalizat
        </button>
      </div>
      {period === "custom" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DateField
            label="Data început"
            value={customStart}
            onChange={onCustomStartChange}
          />
          <DateField
            label="Data sfârșit"
            value={customEnd}
            onChange={onCustomEndChange}
          />
        </div>
      )}
      <p className="mt-4 text-xs font-bold text-slate-500">
        Perioadă analizată: {formatRangeDate(range.start)} –{" "}
        {formatRangeDate(addDays(range.end, -1))}
      </p>
    </section>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black text-slate-600">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
      />
    </label>
  );
}

function ReportContent({
  type,
  analytics,
}: {
  type: ReportType;
  analytics: ReturnType<typeof buildDashboardAnalytics>;
}) {
  if (type === "sales") {
    return (
      <>
        <Metrics
          items={[
            { label: "Vânzări totale", value: formatPrice(analytics.totalSales) },
            { label: "Comenzi", value: String(analytics.orderCount) },
            { label: "Valoare medie", value: formatPrice(analytics.averageOrder) },
            { label: "Vânzări azi", value: formatPrice(analytics.todaySales) },
          ]}
        />
        <ReportTable
          columns={["Zi", "Comenzi", "Vânzări"]}
          rows={analytics.dailySales.map((day) => [
            day.date,
            String(day.orders),
            formatPrice(day.sales),
          ])}
        />
      </>
    );
  }

  if (type === "products") {
    const totalUnits = analytics.products.reduce(
      (total, product) => total + product.quantity,
      0,
    );
    return (
      <>
        <Metrics
          items={[
            { label: "Produse vândute", value: String(totalUnits) },
            {
              label: "Produse comandate",
              value: String(analytics.products.length),
            },
            {
              label: "Produs lider",
              value: analytics.products[0]?.name ?? "—",
            },
            {
              label: "Venit lider",
              value: formatPrice(analytics.products[0]?.revenue ?? 0),
            },
          ]}
        />
        <ReportTable
          columns={["Produs", "Categorie", "Cantitate", "Venit"]}
          rows={analytics.products.map((product) => [
            product.name,
            product.category,
            String(product.quantity),
            formatPrice(product.revenue),
          ])}
        />
      </>
    );
  }

  if (type === "categories") {
    return (
      <>
        <Metrics
          items={[
            {
              label: "Categorii active în vânzări",
              value: String(analytics.categories.length),
            },
            {
              label: "Categorie lider",
              value: analytics.categories[0]?.name ?? "—",
            },
            {
              label: "Venit categorie lider",
              value: formatPrice(analytics.categories[0]?.revenue ?? 0),
            },
            {
              label: "Unități categorie lider",
              value: String(analytics.categories[0]?.quantity ?? 0),
            },
          ]}
        />
        <ReportTable
          columns={["Categorie", "Produse vândute", "Venit"]}
          rows={analytics.categories.map((category) => [
            category.name,
            String(category.quantity),
            formatPrice(category.revenue),
          ])}
        />
      </>
    );
  }

  if (type === "customers") {
    const repeatCustomers = analytics.customers.filter(
      (customer) => customer.orders > 1,
    ).length;
    return (
      <>
        <Metrics
          items={[
            { label: "Clienți", value: String(analytics.customers.length) },
            { label: "Clienți activi", value: String(analytics.activeCustomers) },
            { label: "Clienți recurenți", value: String(repeatCustomers) },
            {
              label: "Client lider",
              value: analytics.customers[0]?.name ?? "—",
            },
          ]}
        />
        <ReportTable
          columns={["Client", "Telefon", "Comenzi", "Valoare", "Ultima comandă"]}
          rows={analytics.customers.map((customer) => [
            customer.name,
            customer.phone,
            String(customer.orders),
            formatPrice(customer.revenue),
            formatDate(customer.lastOrder),
          ])}
        />
      </>
    );
  }

  return (
    <>
      <Metrics
        items={[
          {
            label: "Timp mediu preparare",
            value: formatMinutes(analytics.performance.averagePreparationMinutes),
          },
          {
            label: "Timp mediu total",
            value: formatMinutes(analytics.performance.averageTotalMinutes),
          },
          {
            label: "Respectare ETA",
            value:
              analytics.performance.etaCompliancePercent === null ?
                 "—"
                : `${analytics.performance.etaCompliancePercent}%`,
          },
          {
            label: "Comenzi întârziate",
            value: String(analytics.performance.delayedOrders),
          },
        ]}
      />
      <ReportTable
        columns={[
          "Comandă",
          "ETA",
          "Preparare",
          "Livrare",
          "Total",
          "Diferență ETA",
        ]}
        rows={analytics.performanceRows.map((row) => [
          row.orderNumber,
          `${row.estimatedMinutes} min`,
          formatMinutes(row.preparationMinutes),
          formatMinutes(row.deliveryMinutes),
          formatMinutes(row.totalMinutes),
          formatDifference(row.etaDifferenceMinutes),
        ])}
      />
    </>
  );
}

function Metrics({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-slate-500">{item.label}</p>
          <p className="mt-2 text-xl font-black">{item.value}</p>
        </article>
      ))}
    </section>
  );
}

function ReportTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div
        className="hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-wide text-slate-500 md:grid"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.length ? (
        <div className="divide-y divide-slate-200">
          {rows.map((row, rowIndex) => (
            <div
              key={`${row[0]}-${rowIndex}`}
              className="block space-y-3 px-5 py-5 text-sm md:grid md:space-y-0 md:gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {row.map((value, index) => (
                <div key={`${columns[index]}-${value}`} className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-slate-400 md:hidden">
                    {columns[index]}
                  </span>
                  <p className="mt-1 truncate font-bold md:mt-0">{value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-20 text-center text-sm font-bold text-slate-500">
          Nu există date pentru acest raport.
        </p>
      )}
    </section>
  );
}

function buildExportRows(
  type: ReportType,
  analytics: ReturnType<typeof buildDashboardAnalytics>,
): ReportExportRow[] {
  if (type === "sales") {
    return analytics.dailySales.map((day) => ({
      Data: day.date,
      Comenzi: day.orders,
      "Vânzări RON": day.sales,
    }));
  }
  if (type === "products") {
    return analytics.products.map((product) => ({
      Produs: product.name,
      Categorie: product.category,
      Cantitate: product.quantity,
      "Venit RON": product.revenue,
    }));
  }
  if (type === "categories") {
    return analytics.categories.map((category) => ({
      Categorie: category.name,
      "Produse vândute": category.quantity,
      "Venit RON": category.revenue,
    }));
  }
  if (type === "customers") {
    return analytics.customers.map((customer) => ({
      Client: customer.name,
      Telefon: customer.phone,
      Comenzi: customer.orders,
      "Valoare RON": customer.revenue,
      "Ultima comandă": formatDate(customer.lastOrder),
    }));
  }
  return analytics.performanceRows.map((row) => ({
    Comandă: row.orderNumber,
    "ETA minute": row.estimatedMinutes,
    "Preparare minute": row.preparationMinutes ?? "",
    "Livrare minute": row.deliveryMinutes ?? "",
    "Total minute": row.totalMinutes ?? "",
    "Diferență ETA": row.etaDifferenceMinutes ?? "",
  }));
}

function formatMinutes(value: number | null) {
  return value === null ? "—" : `${value} min`;
}

function formatDifference(value: number | null) {
  if (value === null) return "În desfășurare";
  if (value === 0) return "La timp";
  return `${value > 0 ? "+" : ""}${value} min`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolvePeriodRange(
  period: PeriodId,
  customStart: string,
  customEnd: string,
) {
  const now = new Date();
  const today = startOfDay(now);
  if (period === "today") return { start: today, end: addDays(today, 1) };
  if (period === "yesterday") {
    return { start: addDays(today, -1), end: today };
  }
  if (period === "last7") {
    return { start: addDays(today, -6), end: addDays(today, 1) };
  }
  if (period === "last30") {
    return { start: addDays(today, -29), end: addDays(today, 1) };
  }
  if (period === "currentMonth") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
  if (period === "previousMonth") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }
  if (period === "currentYear") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    };
  }
  const start = startOfDay(parseInputDate(customStart) ?? today);
  const selectedEnd = startOfDay(parseInputDate(customEnd) ?? today);
  return {
    start,
    end: addDays(selectedEnd < start ? start : selectedEnd, 1),
  };
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function parseInputDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toInputDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRangeDate(value: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}
