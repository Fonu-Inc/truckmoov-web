import { formatCurrency } from "@/lib/currency";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const UNAVAILABLE = "—";
export const DATA_USAGE_REFRESH_MS = 60000;

export function formatCount(value?: number | null) {
  return value == null ? UNAVAILABLE : value.toLocaleString();
}

export function formatNgn(value?: number | null) {
  return value == null ? UNAVAILABLE : formatCurrency(value, "NGN");
}

export function formatNgnCompact(value: number) {
  return `₦${new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

const MB_PER_GB = 1024;
const MB_PER_TB = MB_PER_GB * 1024;

export function formatDataMb(valueMb?: number | null) {
  if (valueMb == null) {
    return UNAVAILABLE;
  }
  if (valueMb >= MB_PER_TB) {
    return `${(valueMb / MB_PER_TB).toFixed(1)} TB`;
  }
  if (valueMb >= MB_PER_GB) {
    return `${(valueMb / MB_PER_GB).toFixed(1)} GB`;
  }
  return `${valueMb.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

export function formatDayLabel(day: string, withWeekday: boolean) {
  const date = new Date(`${day}T12:00:00Z`);
  return withWeekday
    ? date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function formatMonthLabel(month: string) {
  const index = Number(month.slice(5, 7)) - 1;
  return MONTH_NAMES[index] ?? month;
}

export function formatLabel(value?: string) {
  if (!value) {
    return "Unknown";
  }
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export const SNAPSHOT_RANGE_OPTIONS = [
  { value: 0, label: "All time" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export function toSnapshotPeriod(days: number) {
  return days === 0 ? "all" : (`${days}d` as "7d" | "30d" | "90d");
}
