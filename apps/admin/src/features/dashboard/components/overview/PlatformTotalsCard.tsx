import type { DashboardPeriod } from "@/features/dashboard/utils/dashboardPeriod";
import { Activity } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { useDashboardTotals } from "@/features/dashboard/hooks/useDashboardTotals";
import { CHART_TOOLTIP_STYLE } from "./overviewFormat";

/** Platform Totals — vehicles, drivers and devices for the period, as the KPI row counts them. */
export function PlatformTotalsCard({ period }: { period: DashboardPeriod }) {
  const { totals } = useDashboardTotals(period);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Platform Totals
        </CardTitle>
        <CardDescription>Vehicles, drivers and devices across all tenants</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={260}
        >
          <BarChart
            data={[
              {
                name: "Vehicles",
                count: totals.vehicles ?? 0,
              },
              {
                name: "Drivers",
                count: totals.drivers ?? 0,
              },
              {
                name: "Devices",
                count: totals.devices ?? 0,
              },
            ]}
            margin={{
              top: 8,
              right: 16,
              bottom: 4,
              left: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              allowDecimals={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number) => [
                value.toLocaleString(),
                "Total",
              ]}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[
                6,
                6,
                0,
                0,
              ]}
              barSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
