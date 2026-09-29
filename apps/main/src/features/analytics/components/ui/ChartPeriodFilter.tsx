import { Calendar } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

export type ChartPeriod = "today" | "yesterday" | "7d" | "10d" | "30d";

const CHART_PERIOD_OPTIONS: {
  value: ChartPeriod; label: string;
}[] = [
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
  },
  {
    value: "7d", label: "Last 7 Days",
  },
  {
    value: "10d", label: "Last 10 Days",
  },
  {
    value: "30d", label: "Last 30 Days",
  },
];

export function ChartPeriodFilter({
  value, onChange,
}: {
  value: ChartPeriod; onChange: (v: ChartPeriod) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as ChartPeriod)}
    >
      <SelectTrigger className="w-[150px] h-8 text-xs">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHART_PERIOD_OPTIONS.map(o => (
          <SelectItem
            key={o.value}
            value={o.value}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
