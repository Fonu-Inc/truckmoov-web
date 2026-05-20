/**
 * Lightweight CSV export utility for tables across the platform.
 * Converts an array of row objects into a CSV file and triggers a download.
 */

export type ExportColumn<T> = {
  header: string;
  accessor: keyof T | ((row: T) => unknown);
};

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  // Quote when contains comma, quote, newline
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  const safeName = filename.replace(/[^a-z0-9-_]+/gi, "_");
  const date = new Date().toISOString().split("T")[0];
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(",");

  const dataLines = rows.map((row) =>
    columns
      .map((c) => {
        const raw =
          typeof c.accessor === "function"
            ? c.accessor(row)
            : (row as any)[c.accessor];
        return escapeCsvCell(raw);
      })
      .join(",")
  );

  const csv = [headerLine, ...dataLines].join("\n");
  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
