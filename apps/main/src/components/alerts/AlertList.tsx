import type { Alert as AlertType } from "@/types";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle, AlertTriangle, Bell, Fuel, Gauge, MapPin, Wrench,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";

type AlertItemProps = {
  alert: AlertType;
  onAcknowledge?: (id: string) => void;
};

export function AlertItem({
  alert, onAcknowledge,
}: AlertItemProps) {
  const typeIcons = {
    geofence: MapPin,
    speed: Gauge,
    maintenance: Wrench,
    fuel: Fuel,
    sos: AlertCircle,
    offline: Bell,
  };

  const severityColors = {
    low: "border-l-info bg-info/5",
    medium: "border-l-warning bg-warning/5",
    high: "border-l-destructive bg-destructive/5",
    critical: "border-l-destructive bg-destructive/10 animate-pulse",
  };

  const Icon = typeIcons[alert.type] || AlertTriangle;

  return (
    <div
      className={cn(
        "rounded-lg border border-border border-l-4 p-4 transition-all duration-200",
        severityColors[alert.severity],
        alert.acknowledged && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 rounded-lg p-2",
              alert.severity === "critical" || alert.severity === "high"
                ? "bg-destructive/20 text-destructive"
                : alert.severity === "medium"
                  ? "bg-warning/20 text-warning"
                  : "bg-info/20 text-info",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-tight">{alert.message}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelative(alert.timestamp)}
            </p>
          </div>
        </div>
        {!alert.acknowledged && onAcknowledge && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0"
          >
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
}

type AlertListProps = {
  alerts: AlertType[];
  onAcknowledge?: (id: string) => void;
  maxItems?: number;
  className?: string;
};

export function AlertList({
  alerts, onAcknowledge, maxItems, className,
}: AlertListProps) {
  const displayedAlerts = maxItems
    ? alerts.slice(
        0,
        maxItems,
      )
    : alerts;

  return (
    <div className={cn(
      "space-y-3",
      className,
    )}
    >
      {displayedAlerts.map(alert => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
        />
      ))}
      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Bell className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No alerts</p>
        </div>
      )}
    </div>
  );
}
