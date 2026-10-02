import type { ReportTrendRange } from "@truckmoov/api/fleet";
import { exportToCSV as exportRows } from "@/lib/exportTable";

export const TREND_RANGES: {
  value: ReportTrendRange; label: string;
}[] = [
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
  },
  {
    value: "last_week", label: "Last week",
  },
  {
    value: "last_month", label: "Last month",
  },
  {
    value: "last_year", label: "Last year",
  },
];

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  exportRows(
    rows,
    headers.map((header, index) => ({
      header, accessor: row => row[index],
    })),
    filename,
  );
}
