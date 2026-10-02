import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";

export type PeriodRange = { from: string; to: string };

const DAYS_BACK: Record<ChartPeriod, { start: number; end: number }> = {
  today: { start: 0, end: 0 },
  yesterday: { start: 1, end: 1 },
  "7d": { start: 6, end: 0 },
  "10d": { start: 9, end: 0 },
  "30d": { start: 29, end: 0 },
};

function localDay(daysBack: number): string {
  const day = new Date();
  day.setDate(day.getDate() - daysBack);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
}

/** Whole-day bounds the report endpoints take as `from` and `to`. */
export function periodToRange(period: ChartPeriod): PeriodRange {
  const { start, end } = DAYS_BACK[period];
  return { from: localDay(start), to: localDay(end) };
}

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "10d": "Last 10 days",
  "30d": "Last 30 days",
};

export function periodLabel(period: ChartPeriod): string {
  return PERIOD_LABELS[period];
}

export function formatMonthLabel(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(year, number - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
