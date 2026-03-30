import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, ArrowUpCircle, Bell, CheckCircle, Clock } from "lucide-react";
import { LucideIcon } from "lucide-react";

// ─── Stat Cards Config ────────────────────────────────────────────────────────
// To update these values when the API is ready:
// 1. Call `alertStatisticsQueryOptions()` from `../api`
// 2. Map the `AlertStatisticsResponse` fields onto these entries
// 3. Replace the hardcoded `value` with the computed values from API data

type StatCard = {
 id: string;
 label: string;
 value: string | number;
 icon: LucideIcon;
 colorClass: string;
 description: string;
};

const ALERT_STAT_CARDS: StatCard[] = [
 {
  id: "total",
  label: "Total Alerts",
  value: 24,
  icon: Bell,
  colorClass: "text-primary",
  description: "All alerts this period",
 },
 {
  id: "open",
  label: "Open",
  value: 8,
  icon: AlertCircle,
  colorClass: "text-warning",
  description: "Requires attention",
 },
 {
  id: "acknowledged",
  label: "Acknowledged",
  value: 12,
  icon: CheckCircle,
  colorClass: "text-blue-500",
  description: "Seen, pending resolution",
 },
 {
  id: "escalated",
  label: "Escalated",
  value: 2,
  icon: ArrowUpCircle,
  colorClass: "text-destructive",
  description: "Escalated to manager",
 },
 {
  id: "mttr",
  label: "Mean Time to Resolve",
  value: "2h 14m",
  icon: Clock,
  colorClass: "text-muted-foreground",
  description: "Average resolution time",
 },
 {
  id: "top_cause",
  label: "Top Cause",
  value: "ETA Breach",
  icon: AlertTriangle,
  colorClass: "text-warning",
  description: "Most frequent alert type",
 },
];

export default function AlertStatistics() {
 return (
  <Card>
   <CardHeader>
    <CardTitle>Alert Statistics</CardTitle>
   </CardHeader>
   <CardContent>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
     {ALERT_STAT_CARDS.map((stat) => {
      const Icon = stat.icon;
      return (
       <div key={stat.id} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
         <Icon className={`h-4 w-4 ${stat.colorClass}`} />
         <span className="text-xs text-muted-foreground">{stat.label}</span>
        </div>
        <p className="text-2xl font-bold">{stat.value}</p>
        <p className="text-xs text-muted-foreground">{stat.description}</p>
       </div>
      );
     })}
    </div>
   </CardContent>
  </Card>
 );
}
