import type { FleetDevice } from "@truckmoov/api/fleet";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_ATTEMPTS = 8;

type DeviceProvisionBadgeProps = {
  device: Pick<FleetDevice, "provisionStatus" | "provisionAttempts" | "provisionNextAttemptAt" | "provisionError">;
  className?: string;
};

export function provisionMessage(device: DeviceProvisionBadgeProps["device"]): string | null {
  if (device.provisionStatus !== "failed")
    return null;
  if (!device.provisionNextAttemptAt)
    return "Gave up: contact support";
  const attempt = Math.min(device.provisionAttempts ?? 1, MAX_ATTEMPTS);
  return `Could not register with the tracking network, retrying at ${formatDayMonthTime(device.provisionNextAttemptAt)} (attempt ${attempt} of ${MAX_ATTEMPTS})`;
}

export function DeviceProvisionBadge({ device, className }: DeviceProvisionBadgeProps) {
  const message = provisionMessage(device);
  if (!message)
    return null;
  const gaveUp = !device.provisionNextAttemptAt;
  return (
    <div
      title={device.provisionError ?? undefined}
      className={cn(
        "flex items-start gap-1.5 rounded-md px-2 py-1 text-xs",
        gaveUp ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
