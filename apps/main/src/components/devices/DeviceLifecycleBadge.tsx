import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

type DeviceLifecycleStatus = string;

const lifecycleStatusConfig: Record<string, { label: string; color: string; bgColor: string; description?: string }> = {
  registered: { label: "Registered", color: "text-gray-600", bgColor: "bg-gray-100", description: "Device has been registered but not yet configured." },
  config_pending: { label: "Config Pending", color: "text-yellow-700", bgColor: "bg-yellow-100", description: "Awaiting installer configuration." },
  configured: { label: "Configured", color: "text-blue-700", bgColor: "bg-blue-100", description: "Device configured, awaiting first telemetry." },
  verified_online: { label: "Verified Online", color: "text-cyan-700", bgColor: "bg-cyan-100", description: "Device has sent valid telemetry." },
  assignable: { label: "Assignable", color: "text-green-700", bgColor: "bg-green-100", description: "Device is ready to be assigned to a vehicle." },
  assigned: { label: "Assigned", color: "text-indigo-700", bgColor: "bg-indigo-100", description: "Device is assigned to a vehicle." },
  faulty: { label: "Faulty", color: "text-red-700", bgColor: "bg-red-100", description: "Device has reported a fault." },
  decommissioned: { label: "Decommissioned", color: "text-gray-500", bgColor: "bg-gray-200", description: "Device has been decommissioned." },
};

interface DeviceLifecycleBadgeProps {
  status: DeviceLifecycleStatus | string;
  showDescription?: boolean;
  size?: "sm" | "default";
}

export function DeviceLifecycleBadge({ 
  status, 
  showDescription = false,
  size = "default" 
}: DeviceLifecycleBadgeProps) {
  // Handle both new lifecycle statuses and legacy statuses
  const config = lifecycleStatusConfig[status as DeviceLifecycleStatus];
  
  if (!config) {
    // Fallback for legacy statuses
    const legacyConfig: Record<string, { label: string; color: string; bgColor: string }> = {
      active: { label: "Active", color: "text-green-600", bgColor: "bg-green-100" },
      inactive: { label: "Inactive", color: "text-gray-600", bgColor: "bg-gray-100" },
    };
    
    const fallback = legacyConfig[status] || { 
      label: status, 
      color: "text-gray-600", 
      bgColor: "bg-gray-100" 
    };
    
    return (
      <Badge 
        variant="outline" 
        className={cn(
          fallback.bgColor,
          fallback.color,
          "border-transparent",
          size === "sm" && "text-xs px-1.5 py-0"
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
          size === "sm" && "text-xs px-1.5 py-0"
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
