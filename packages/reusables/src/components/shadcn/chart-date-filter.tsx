import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

export type ChartDateRange = "today" | "yesterday" | "7d" | "30d" | "90d";

const ALL_OPTIONS: Record<ChartDateRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

interface ChartDateFilterProps {
  value: ChartDateRange;
  onValueChange: (value: ChartDateRange) => void;
  className?: string;
  /** Restrict which presets are shown. Defaults to today/yesterday/7d/30d. */
  options?: ChartDateRange[];
}

/**
 * Standardized date-range filter for dashboard charts.
 * Calendar icon on the left, configurable preset options.
 */
export function ChartDateFilter({
  value,
  onValueChange,
  className,
  options = ["today", "yesterday", "7d", "30d"],
}: ChartDateFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as ChartDateRange)}>
      <SelectTrigger className={className ?? "w-[150px] h-8"}>
        <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {ALL_OPTIONS[opt]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
