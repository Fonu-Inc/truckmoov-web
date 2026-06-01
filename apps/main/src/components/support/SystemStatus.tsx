import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface SystemComponent {
  name: string;
  status: "operational" | "degraded" | "outage";
  description?: string;
}

// This would typically come from an API
const systemComponents: SystemComponent[] = [
  { name: "Platform Core", status: "operational" },
  { name: "Telemetry Ingestion", status: "operational" },
  { name: "WhatsApp Delivery", status: "operational" },
  { name: "SMS Gateway", status: "operational" },
  { name: "IoT SIM Provisioning", status: "operational" },
  { name: "Billing & Payments", status: "operational" },
];

const statusConfig = {
  operational: { label: "Operational", icon: CheckCircle2, color: "text-chart-2" },
  degraded: { label: "Degraded", icon: AlertTriangle, color: "text-chart-5" },
  outage: { label: "Outage", icon: XCircle, color: "text-destructive" },
};

export function SystemStatus() {
  const overallStatus = systemComponents.every((c) => c.status === "operational")
    ? "operational"
    : systemComponents.some((c) => c.status === "outage")
    ? "outage"
    : "degraded";

  const overall = statusConfig[overallStatus];
  const OverallIcon = overall.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">System Status</CardTitle>
            <CardDescription>Current platform health</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <OverallIcon className={`h-5 w-5 ${overall.color}`} />
            <Badge variant={overallStatus === "operational" ? "outline" : "destructive"}>
              {overall.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {systemComponents.map((component) => {
            const config = statusConfig[component.status];
            const Icon = config.icon;
            return (
              <div
                key={component.name}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <span className="text-sm">{component.name}</span>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
