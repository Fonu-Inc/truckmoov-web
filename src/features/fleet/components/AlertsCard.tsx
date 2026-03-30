import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Bell, CheckCircle, CheckCheck, Info } from "lucide-react";
import { useAcknowledgeAlert, useResolveAlert } from "../api";
import { Alert, AlertSeverity, AlertStatus } from "../api/types";
import { useMemo } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// TODO: Replace MOCK_ALERTS with real API data when endpoint is stable:
//   const { data } = useQuery(listAlertsQueryOptions({ params: {} }))
//   const alerts = data?.data ?? []

const MOCK_ALERTS: Alert[] = [
 {
  id: "alert-1",
  type: "eta_breach",
  severity: "high",
  status: "open",
  vehicleId: "V-001",
  jobId: "J-1042",
  details: {},
  triggeredAt: "2026-03-30T07:15:00Z",
  acknowledgedAt: "",
  resolvedAt: "",
  escalatedAt: "",
  acknowledgedBy: "",
  resolvedBy: "",
 },
 {
  id: "alert-2",
  type: "route_deviation",
  severity: "medium",
  status: "acknowledged",
  vehicleId: "V-003",
  jobId: "J-1038",
  details: {},
  triggeredAt: "2026-03-30T06:40:00Z",
  acknowledgedAt: "2026-03-30T06:55:00Z",
  resolvedAt: "",
  escalatedAt: "",
  acknowledgedBy: "dispatcher-01",
  resolvedBy: "",
 },
 {
  id: "alert-3",
  type: "unauthorized_usage",
  severity: "critical",
  status: "open",
  vehicleId: "V-007",
  jobId: "",
  details: {},
  triggeredAt: "2026-03-30T05:30:00Z",
  acknowledgedAt: "",
  resolvedAt: "",
  escalatedAt: "",
  acknowledgedBy: "",
  resolvedBy: "",
 },
 {
  id: "alert-4",
  type: "eta_breach",
  severity: "low",
  status: "resolved",
  vehicleId: "V-002",
  jobId: "J-1030",
  details: {},
  triggeredAt: "2026-03-29T18:00:00Z",
  acknowledgedAt: "2026-03-29T18:10:00Z",
  resolvedAt: "2026-03-29T19:45:00Z",
  escalatedAt: "",
  acknowledgedBy: "dispatcher-02",
  resolvedBy: "dispatcher-02",
 },
 {
  id: "alert-5",
  type: "route_deviation",
  severity: "high",
  status: "excalated",
  vehicleId: "V-005",
  jobId: "J-1035",
  details: {},
  triggeredAt: "2026-03-30T04:00:00Z",
  acknowledgedAt: "2026-03-30T04:15:00Z",
  resolvedAt: "",
  escalatedAt: "2026-03-30T04:45:00Z",
  acknowledgedBy: "dispatcher-01",
  resolvedBy: "",
 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSeverityIcon = (severity: AlertSeverity) => {
 switch (severity) {
  case "critical":
   return <AlertTriangle className="h-5 w-5 text-destructive" />;
  case "high":
   return <AlertCircle className="h-5 w-5 text-warning" />;
  case "medium":
   return <Info className="h-5 w-5 text-primary" />;
  default:
   return <Info className="h-5 w-5 text-muted-foreground" />;
 }
};

const getSeverityBadge = (severity: AlertSeverity) => {
 switch (severity) {
  case "critical":
   return <Badge variant="destructive">Critical</Badge>;
  case "high":
   return <Badge className="bg-warning/10 text-warning border-warning/30">High</Badge>;
  case "medium":
   return <Badge className="bg-primary/10 text-primary border-primary/30">Medium</Badge>;
  default:
   return <Badge variant="secondary">Low</Badge>;
 }
};

const ALERT_TYPE_LABELS: Record<string, string> = {
 eta_breach: "ETA Breach",
 route_deviation: "Route Deviation",
 unauthorized_usage: "Unauthorized Usage",
};

const formatAlertType = (type: string) =>
 ALERT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");

// ─── Props ────────────────────────────────────────────────────────────────────

type AlertsCardProps = {
 search: string;
 severity: AlertSeverity | "all";
 status: AlertStatus | "all";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AlertsCard({ search, severity, status }: AlertsCardProps) {
 const { mutate: acknowledge, isPending: isAcknowledging } = useAcknowledgeAlert();
 const { mutate: resolve, isPending: isResolving } = useResolveAlert();

 const alerts = useMemo(() => {
  return MOCK_ALERTS.filter((alert) => {
   if (severity !== "all" && alert.severity !== severity) return false;
   if (status !== "all" && alert.status !== status) return false;
   if (search && !formatAlertType(alert.type).toLowerCase().includes(search.toLowerCase())) return false;
   return true;
  });
 }, [search, severity, status]);

 if (alerts.length === 0) {
  return (
   <div className="text-center py-8 text-muted-foreground">
    <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
    <p>No alerts found</p>
   </div>
  );
 }

 return (
  <>
   {alerts.map((alert) => {
    const isOpen = alert.status === "open" || alert.status === "excalated";
    const canAcknowledge = !alert.acknowledgedAt;

    return (
     <div
      key={alert.id}
      className={cn(
       "flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
       alert.status === "resolved"
        ? "border-border bg-muted/30"
        : isOpen
         ? "border-warning/50 bg-warning/5"
         : "border-border bg-muted/10"
      )}
     >
      <div className="flex items-start gap-3">
       {getSeverityIcon(alert.severity)}
       <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
         <p className="font-semibold">{formatAlertType(alert.type)}</p>
         {getSeverityBadge(alert.severity)}
         {alert.acknowledgedAt && !alert.resolvedAt && !alert.escalatedAt && (
          <Badge variant="outline" className="text-xs">Acknowledged</Badge>
         )}
         {alert.escalatedAt && (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">Escalated</Badge>
         )}
         {alert.resolvedAt && (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Resolved</Badge>
         )}
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
         <span>Vehicle: {alert.vehicleId}</span>
         {alert.jobId && <span>Job: {alert.jobId}</span>}
         <span>Triggered: {new Date(alert.triggeredAt).toLocaleString()}</span>
        </div>
       </div>
      </div>
      <div className="flex items-center gap-2">
       {canAcknowledge && (
        <Button
         size="sm"
         variant="outline"
         disabled={isAcknowledging}
         onClick={() => acknowledge({ id: alert.id })}
        >
         <CheckCircle className="h-4 w-4 mr-1" />
         Acknowledge
        </Button>
       )}
       {!alert.resolvedAt && (
        <Button
         size="sm"
         variant="ghost"
         disabled={isResolving}
         onClick={() => resolve({ id: alert.id })}
         title="Resolve alert"
        >
         <CheckCheck className="h-4 w-4" />
        </Button>
       )}
      </div>
     </div>
    );
   })}
  </>
 );
}
