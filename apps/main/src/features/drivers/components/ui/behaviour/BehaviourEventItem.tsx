import type {
  DriverBehaviorEvent, DriverBehaviorSeverity,
} from "@truckmoov/api/fleet";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  Car, Gauge, Phone, RotateCcw, User, Zap,
} from "lucide-react";

const SEVERITY_CLASS: Record<DriverBehaviorSeverity, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

function EventIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes("brak") || t.includes("brake"))
    return <Car className="h-4 w-4" />;
  if (t.includes("accel"))
    return <Zap className="h-4 w-4" />;
  if (t.includes("corner") || t.includes("turn"))
    return <RotateCcw className="h-4 w-4" />;
  return <Gauge className="h-4 w-4" />;
}

/** One row of the Behavior Events list. */
export function BehaviourEventItem({
  event, driverName, phone,
}: {
  event: DriverBehaviorEvent; driverName: string; phone: string;
}) {
  return (
    <div className={`p-3 rounded-lg border ${SEVERITY_CLASS[event.severity] ?? SEVERITY_CLASS.low}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EventIcon type={event.type} />
          <span className="font-medium text-sm capitalize">
            {event.type.replace(
              /_/g,
              " ",
            )}
          </span>
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground border-border text-xs capitalize">{event.severity}</div>
        </div>
        <span className="text-xs text-muted-foreground">{formatRelative(event.occurredAt)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {driverName}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Phone className="h-3 w-3" />
          {phone}
        </span>
      </div>
      <p className="text-xs mt-1 text-muted-foreground">{`Speed: ${event.speedKph != null ? `${Math.round(event.speedKph)} km/h` : "—"}`}</p>
    </div>
  );
}
