import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import { CalendarRange } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { PERIOD_OPTIONS } from "@/features/dashboard/utils/dashboardPeriod";

export function PeriodSelect({
  value, onChange, inline = false, options = PERIOD_OPTIONS,
}: {
  value: DashboardPeriod; onChange: (v: DashboardPeriod) => void; inline?: boolean; options?: {
    value: DashboardPeriod; label: string;
  }[];
}) {
  return (
    <div className={inline ? "flex" : "flex justify-end"}>
      <Select
        value={value}
        onValueChange={v => onChange(v as DashboardPeriod)}
      >
        <SelectTrigger
          className={inline ? "h-9 w-[160px] rounded-xl" : "w-[180px] rounded-xl"}
          aria-label="Report period"
        >
          <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem
              key={o.value}
              value={o.value}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
