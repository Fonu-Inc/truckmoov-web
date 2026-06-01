import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";

export type PeriodValue = "0" | "1" | "7" | "30" | "90" | "180" | "365";

const DEFAULT_OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "180", label: "Last 6 Months" },
  { value: "365", label: "Last Year" },
];

const SHORT_OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: "0", label: "Today" },
  { value: "1", label: "Yesterday" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  className?: string;
  options?: { value: PeriodValue; label: string }[];
  variant?: "default" | "short";
}

export function PeriodFilter({ value, onChange, className, options, variant = "default" }: PeriodFilterProps) {
  const opts = options ?? (variant === "short" ? SHORT_OPTIONS : DEFAULT_OPTIONS);
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PeriodValue)}>
      <SelectTrigger className={className ?? "w-[160px]"}>
        <Calendar className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
