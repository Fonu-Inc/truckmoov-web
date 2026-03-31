import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportType } from "./ReportTypeSelect";

const PIE_DATA: Record<ReportType, { name: string; value: number; color: string }[]> = {
  job_performance: [
    { name: "Completed", value: 1140, color: "#22c55e" },
    { name: "In Progress", value: 37, color: "#f59e0b" },
    { name: "Cancelled", value: 71, color: "#ef4444" },
  ],
  fleet_utilization: [
    { name: "Active", value: 64, color: "#22c55e" },
    { name: "Idle", value: 14, color: "#f59e0b" },
    { name: "Maintenance", value: 6, color: "#ef4444" },
  ],
  driver_performance: [
    { name: "On Time", value: 55, color: "#22c55e" },
    { name: "Late", value: 5, color: "#f59e0b" },
    { name: "Absent", value: 2, color: "#ef4444" },
  ],
  route_analysis: [
    { name: "On Route", value: 91, color: "#22c55e" },
    { name: "Deviated", value: 6, color: "#f59e0b" },
    { name: "Returned", value: 3, color: "#ef4444" },
  ],
};

const PIE_LABELS: Record<ReportType, string> = {
  job_performance: "Job Status Distribution",
  fleet_utilization: "Fleet Status Split",
  driver_performance: "Driver Attendance Split",
  route_analysis: "Route Compliance Split",
};

const chartConfig = {};

interface ReportPieChartProps {
  reportType: ReportType;
}

export default function ReportPieChart({ reportType }: ReportPieChartProps) {
  const data = PIE_DATA[reportType];
  const title = PIE_LABELS[reportType];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={75}
              innerRadius={40}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
