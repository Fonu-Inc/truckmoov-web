import StatCard from "@/shared/components/StatCard";
import type { ReportType } from "./ReportTypeSelect";

interface KpiSet {
  totalJobs: { label: string; value: string; color?: string };
  completionRate: { label: string; value: string; color?: string };
  avgDelay: { label: string; value: string; color?: string };
  activeVehicles: { label: string; value: string; color?: string };
}

const KPI_DATA: Record<ReportType, KpiSet> = {
  job_performance: {
    totalJobs: { label: "Total Jobs", value: "1,248" },
    completionRate: { label: "Completion Rate", value: "91.4%", color: "text-success" },
    avgDelay: { label: "Avg Delay", value: "14 min", color: "text-warning" },
    activeVehicles: { label: "Jobs In-Progress", value: "37" },
  },
  fleet_utilization: {
    totalJobs: { label: "Total Vehicles", value: "84" },
    completionRate: { label: "Utilization Rate", value: "76.2%", color: "text-success" },
    avgDelay: { label: "Avg Idle Time", value: "2.4 hrs", color: "text-warning" },
    activeVehicles: { label: "Under Maintenance", value: "6" },
  },
  driver_performance: {
    totalJobs: { label: "Active Drivers", value: "62" },
    completionRate: { label: "On-Time Rate", value: "88.7%", color: "text-success" },
    avgDelay: { label: "Avg Trips / Driver", value: "19.3" },
    activeVehicles: { label: "Incidents Reported", value: "4", color: "text-destructive" },
  },
  route_analysis: {
    totalJobs: { label: "Total Distance", value: "48,210 km" },
    completionRate: { label: "On-Route Rate", value: "94.1%", color: "text-success" },
    avgDelay: { label: "Fuel Efficiency", value: "7.8 L/100km" },
    activeVehicles: { label: "Route Deviations", value: "23", color: "text-warning" },
  },
};

interface ReportKpiCardsProps {
  reportType: ReportType;
}

export default function ReportKpiCards({ reportType }: ReportKpiCardsProps) {
  const kpis = KPI_DATA[reportType];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label={kpis.totalJobs.label} value={kpis.totalJobs.value} color={kpis.totalJobs.color} />
      <StatCard label={kpis.completionRate.label} value={kpis.completionRate.value} color={kpis.completionRate.color} />
      <StatCard label={kpis.avgDelay.label} value={kpis.avgDelay.value} color={kpis.avgDelay.color} />
      <StatCard label={kpis.activeVehicles.label} value={kpis.activeVehicles.value} color={kpis.activeVehicles.color} />
    </div>
  );
}
