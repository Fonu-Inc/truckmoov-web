import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportType } from "./ReportTypeSelect";

const BAR_DATA: Record<ReportType, { day: string; value: number }[]> = {
  job_performance: [
    { day: "Mon", value: 42 },
    { day: "Tue", value: 58 },
    { day: "Wed", value: 51 },
    { day: "Thu", value: 67 },
    { day: "Fri", value: 74 },
    { day: "Sat", value: 39 },
    { day: "Sun", value: 21 },
  ],
  fleet_utilization: [
    { day: "Mon", value: 71 },
    { day: "Tue", value: 78 },
    { day: "Wed", value: 65 },
    { day: "Thu", value: 80 },
    { day: "Fri", value: 76 },
    { day: "Sat", value: 55 },
    { day: "Sun", value: 40 },
  ],
  driver_performance: [
    { day: "Mon", value: 18 },
    { day: "Tue", value: 22 },
    { day: "Wed", value: 19 },
    { day: "Thu", value: 25 },
    { day: "Fri", value: 27 },
    { day: "Sat", value: 14 },
    { day: "Sun", value: 9 },
  ],
  route_analysis: [
    { day: "Mon", value: 6820 },
    { day: "Tue", value: 7450 },
    { day: "Wed", value: 6910 },
    { day: "Thu", value: 7800 },
    { day: "Fri", value: 8100 },
    { day: "Sat", value: 5200 },
    { day: "Sun", value: 3100 },
  ],
};

const BAR_LABELS: Record<ReportType, string> = {
  job_performance: "Jobs Completed by Day",
  fleet_utilization: "Utilization % by Day",
  driver_performance: "Trips Completed by Day",
  route_analysis: "Distance Covered (km) by Day",
};

const chartConfig = {
  value: { label: "Value", color: "hsl(var(--primary))" },
};

interface ReportBarChartProps {
  reportType: ReportType;
}

export default function ReportBarChart({ reportType }: ReportBarChartProps) {
  const data = BAR_DATA[reportType];
  const title = BAR_LABELS[reportType];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
