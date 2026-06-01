import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";
import { 
  DeviceLifecycleStatus, 
  lifecycleStatusConfig 
} from "@/hooks/useDeviceLifecycle";

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



