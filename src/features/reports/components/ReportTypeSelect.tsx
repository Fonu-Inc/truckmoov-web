import { BarChart3, Truck, Users, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportType = "job_performance" | "fleet_utilization" | "driver_performance" | "route_analysis";

interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const OPTIONS: ReportTypeOption[] = [
  {
    value: "job_performance",
    label: "Job Performance",
    description: "Completion rates, delays, and SLA adherence",
    icon: BarChart3,
  },
  {
    value: "fleet_utilization",
    label: "Fleet Utilization",
    description: "Vehicle uptime, idle time, and maintenance cycles",
    icon: Truck,
  },
  {
    value: "driver_performance",
    label: "Driver Performance",
    description: "Trip counts, on-time rate, and incident history",
    icon: Users,
  },
  {
    value: "route_analysis",
    label: "Route Analysis",
    description: "Distance covered, fuel efficiency, and deviation rate",
    icon: Route,
  },
];

interface ReportTypeSelectProps {
  value: ReportType;
  onChange: (value: ReportType) => void;
}

export default function ReportTypeSelect({ value, onChange }: ReportTypeSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            <Icon className={cn("h-5 w-5 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
            <p className={cn("text-sm font-semibold", isSelected ? "text-foreground" : "text-foreground")}>
              {opt.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
