"use client";

import * as XLSX from "xlsx";

export type ReportExportRow = Record<string, string | number>;

export function exportReportCsv(
  filename: string,
  rows: ReportExportRow[],
) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const csv = [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\r\n");
  downloadBlob(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    `${filename}.csv`,
  );
}

export function exportReportXlsx(
  filename: string,
  sheetName: string,
  rows: ReportExportRow[],
) {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = Object.keys(rows[0]).map((column) => ({
    wch: Math.max(
      column.length + 2,
      ...rows.map((row) => String(row[column]).length + 2),
    ),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
