"use client";

import * as XLSX from "xlsx";
import type { OrderPerformanceRow } from "@/features/dashboard/order-performance";

const columns = [
  "Comandă",
  "Acceptată la",
  "ETA (min)",
  "Timp preparare (min)",
  "Timp livrare (min)",
  "Timp total (min)",
  "Diferență ETA (min)",
  "Respectat ETA",
] as const;

export function exportPerformanceCsv(rows: OrderPerformanceRow[]) {
  const data = rows.map(toExportRow);
  const csv = [
    columns.join(","),
    ...data.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
  downloadBlob(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    createFilename("csv"),
  );
}

export function exportPerformanceXlsx(rows: OrderPerformanceRow[]) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...columns],
    ...rows.map(toExportRow),
  ]);
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Performanță comenzi");
  XLSX.writeFile(workbook, createFilename("xlsx"));
}

function toExportRow(row: OrderPerformanceRow) {
  return [
    row.orderNumber,
    new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(row.acceptedAt)),
    row.estimatedMinutes,
    row.preparationMinutes ?? "",
    row.deliveryMinutes ?? "",
    row.totalMinutes ?? "",
    row.etaDifferenceMinutes ?? "",
    row.onTime === null ? "În desfășurare" : row.onTime ? "Da" : "Nu",
  ];
}

function csvCell(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function createFilename(extension: "csv" | "xlsx") {
  return `raport-performanta-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
