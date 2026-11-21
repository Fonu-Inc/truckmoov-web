import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";

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

/** "2026-11-21" (an Africa/Lagos calendar day) → "Sat". Noon avoids a timezone day shift. */
export function formatWeekdayLabel(day: string) {
  return formatWithPattern(
    `${day}T12:00:00`,
    "EEE",
    day,
  );
}

/** "2026-11" → "Nov". */
export function formatMonthLabel(month: string) {
  const index = Number(month.slice(
    5,
    7,
  )) - 1;
  return MONTH_NAMES[index] ?? month;
}

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};
