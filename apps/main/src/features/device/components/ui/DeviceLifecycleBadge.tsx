import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

type DeviceLifecycleStatus = string;

const lifecycleStatusConfig: Record<string, {
  label: string; color: string; bgColor: string; description?: string;
}> = {
  registered: {
    label: "Registered", color: "text-muted-foreground", bgColor: "bg-muted", description: "Device has been registered but not yet configured.",
  },
  config_pending: {
    label: "Config Pending", color: "text-warning", bgColor: "bg-warning/10", description: "Awaiting installer configuration.",
  },
  configured: {
    label: "Configured", color: "text-info", bgColor: "bg-info/10", description: "Device configured, awaiting first telemetry.",
  },
  verified_online: {
    label: "Verified Online", color: "text-info", bgColor: "bg-info/15", description: "Device has sent valid telemetry.",
  },
  assignable: {
    label: "Assignable", color: "text-success", bgColor: "bg-success/10", description: "Device is ready to be assigned to a vehicle.",
  },
  assigned: {
    label: "Assigned", color: "text-primary", bgColor: "bg-primary/10", description: "Device is assigned to a vehicle.",
  },
  faulty: {
    label: "Faulty", color: "text-destructive", bgColor: "bg-destructive/10", description: "Device has reported a fault.",
  },
  decommissioned: {
    label: "Decommissioned", color: "text-muted-foreground", bgColor: "bg-muted/60", description: "Device has been decommissioned.",
  },
};

type DeviceLifecycleBadgeProps = {
  status: DeviceLifecycleStatus | string;
  showDescription?: boolean;
  size?: "sm" | "default";
};

export function DeviceLifecycleBadge({
  status,
  showDescription = false,
  size = "default",
}: DeviceLifecycleBadgeProps) {
  // Handle both new lifecycle statuses and legacy statuses
  const config = lifecycleStatusConfig[status as DeviceLifecycleStatus];

  if (!config) {
    // Fallback for legacy statuses
    const legacyConfig: Record<string, {
      label: string; color: string; bgColor: string;
    }> = {
      active: {
        label: "Active", color: "text-success", bgColor: "bg-success/10",
      },
      inactive: {
        label: "Inactive", color: "text-muted-foreground", bgColor: "bg-muted",
      },
    };

    const fallback = legacyConfig[status] || {
      label: status,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };

    return (
      <Badge
        variant="outline"
        className={cn(
          fallback.bgColor,
          fallback.color,
          "border-transparent",
          size === "sm" && "text-xs px-1.5 py-0",
        )}
      >
        {fallback.label}
      </Badge>
    );
  }

  return (
    <div className={showDescription ? "flex flex-col gap-1" : ""}>
      <Badge
        variant="outline"
        className={cn(
          config.bgColor,
          config.color,
          "border-transparent",
          size === "sm" && "text-xs px-1.5 py-0",
        )}
      >
        {config.label}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </div>
  );
}
