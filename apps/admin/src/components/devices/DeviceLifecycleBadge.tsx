import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

type DeviceLifecycleStatus
  = | "registered"
    | "config_pending"
    | "configured"
    | "verified_online"
    | "assignable"
    | "assigned"
    | "faulty"
    | "decommissioned";

type LifecycleConfig = {
  label: string;
  color: string;
  bgColor: string;
  description: string;
};

const lifecycleStatusConfig: Record<DeviceLifecycleStatus, LifecycleConfig> = {
  registered: {
    label: "Registered",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    description: "Device has been registered",
  },
  config_pending: {
    label: "Config Pending",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    description: "Awaiting configuration",
  },
  configured: {
    label: "Configured",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "Device is configured",
  },
  verified_online: {
    label: "Verified Online",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    description: "Device verified and online",
  },
  assignable: {
    label: "Assignable",
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Ready to be assigned",
  },
  assigned: {
    label: "Assigned",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "Assigned to a vehicle",
  },
  faulty: {
    label: "Faulty",
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "Device has a fault",
  },
  decommissioned: {
    label: "Decommissioned",
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    description: "Device is decommissioned",
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
      label: string;
      color: string;
      bgColor: string;
    }> = {
      active: {
        label: "Active",
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      inactive: {
        label: "Inactive",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
    };

    const fallback = legacyConfig[status] || {
      label: status,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
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
