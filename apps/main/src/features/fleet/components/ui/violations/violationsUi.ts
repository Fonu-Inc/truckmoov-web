import type {
  DriverBehaviorSeverity, ViolationQuotaPeriod, ViolationSubject, ViolationType,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";

// Class strings copied verbatim from the design app's Violations tab.
export const CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground";
export const EXPORT_BUTTON_CLASS = "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-secondary hover:text-foreground h-8 rounded-lg px-3 text-xs bg-transparent border-input";
export const FILTER_BUTTON_CLASS = "inline-flex items-center justify-center whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-border bg-transparent hover:bg-secondary hover:text-foreground h-8 rounded-lg px-3 text-xs gap-2";
export const GHOST_ROW_BUTTON_CLASS = "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-secondary hover:text-foreground h-8 rounded-lg px-3 text-xs";
export const INPUT_CLASS = "flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-foreground pl-9";
export const SEARCH_ICON_CLASS = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground";
export const TABLE_CLASS = "w-full caption-bottom text-sm";
export const THEAD_CLASS = "[&_tr]:border-b";
export const TBODY_CLASS = "[&_tr:last-child]:border-0";
export const TR_CLASS = "border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50";
export const TH_CLASS = "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0";
export const TH_RIGHT_CLASS = "h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right";
export const TD_CLASS = "p-4 align-middle [&:has([role=checkbox])]:pr-0";
export const PILL_BASE_CLASS = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
/** The Vehicle Violations / Violation Events pills keep the default badge's shadow + hover. */
export const PILL_SHADOW_CLASS = `${PILL_BASE_CLASS} shadow-sm hover:bg-primary/90`;

export const SEVERITY_CLASS: Record<DriverBehaviorSeverity, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-muted",
};

const TYPE_LABELS: Record<string, string> = {
  speeding: "Overspeeding",
  overspeed: "Overspeeding",
  overspeeding: "Overspeeding",
  harsh_brake: "Harsh Braking",
  harsh_braking: "Harsh Braking",
  hard_brake: "Harsh Braking",
  harsh_accel: "Harsh Acceleration",
  harsh_acceleration: "Harsh Acceleration",
  hard_accel: "Harsh Acceleration",
  sharp_turn: "Sharp Turn",
  harsh_cornering: "Sharp Turn",
  restricted_hours: "Restricted Driving Hours",
};

export const VIOLATION_TYPES: ViolationType[] = [
  "overspeeding",
  "harsh_braking",
  "harsh_acceleration",
  "harsh_cornering",
  "restricted_hours",
];

export const quotaText = (q: ViolationSubject["quota"]) => (q ? `${q.used} of ${q.quota}` : "—");

/** "10 / month" */
export const QUOTA_PERIOD_UNIT: Record<ViolationQuotaPeriod, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

/** Behaviour-event type → the design app's violation-type wording. */
export function violationTypeLabel(type: string) {
  return TYPE_LABELS[type.toLowerCase()]
    ?? type.replace(
      /[_-]+/g,
      " ",
    ).replace(
      /\b\w/g,
      c => c.toUpperCase(),
    );
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "21 Nov 2026, 10:05 PM" */
export function formatViolationDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(
    d,
    "dd MMM yyyy, hh:mm a",
  );
}

export function downloadViolationsCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [
    header,
    ...rows,
  ].map(r => r.map(c => `"${String(c).replace(
    /"/g,
    "\"\"",
  )}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(
    [csv],
    { type: "text/csv;charset=utf-8;" },
  ));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${format(
    new Date(),
    "yyyy-MM-dd",
  )}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
