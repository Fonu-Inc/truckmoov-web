import type { ElementType } from "react";
import { Card } from "@/components/shadcn/card";

export type KpiStat = {
  label: string;
  value: string | number;
  icon: ElementType;
};

export function TabKpiCards({ stats }: { stats: KpiStat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold truncate">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
