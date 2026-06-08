import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

export type DeviceHealthStatus = "healthy" | "warning" | "critical" | "offline" | null;

interface DeviceHealthBadgeProps {
  healthStatus: DeviceHealthStatus | string | null;
  lastSeen?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  healthy: { label: "Healthy", dot: "bg-green-500" },
  warning: { label: "Warning", dot: "bg-amber-500" },
  critical: { label: "Critical", dot: "bg-red-500" },
  offline: { label: "Offline", dot: "bg-gray-400" },
};

export function DeviceHealthBadge({ healthStatus, showLabel = false, size = "sm" }: DeviceHealthBadgeProps) {
  const key = (healthStatus as string) ?? "offline";
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.offline;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", size === "md" ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0")}
    >
      <span className={cn("rounded-full shrink-0", config.dot, size === "md" ? "h-2 w-2" : "h-1.5 w-1.5")} />
      {showLabel && config.label}
    </Badge>
  );
}
