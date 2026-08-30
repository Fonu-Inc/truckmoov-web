import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle, Circle, WifiOff,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/shadcn/tooltip";

export type DeviceHealthStatus = "online" | "degraded" | "offline";

type DeviceHealthBadgeProps = {
  healthStatus: DeviceHealthStatus | null;
  lastSeen?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
};

const healthConfig: Record<DeviceHealthStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  description: string;
}> = {
  online: {
    label: "Online",
    color: "text-success",
    bgColor: "bg-success/10 border-success/20",
    icon: Circle,
    description: "Device is actively sending telemetry",
  },
  degraded: {
    label: "Degraded",
    color: "text-warning",
    bgColor: "bg-warning/10 border-warning/20",
    icon: AlertCircle,
    description: "Device heartbeat delayed (3-10 min)",
  },
  offline: {
    label: "Offline",
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/20",
    icon: WifiOff,
    description: "No telemetry received for 10+ minutes",
  },
};

export function DeviceHealthBadge({
  healthStatus,
  lastSeen,
  showLabel = true,
  size = "md",
}: DeviceHealthBadgeProps) {
  const status = healthStatus || "offline";
  const config = healthConfig[status];
  const Icon = config.icon;

  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";

  const lastSeenText = lastSeen
    ? formatRelative(lastSeen)
    : "Never";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${config.bgColor} ${textSize} gap-1.5 cursor-help border`}
          >
            <Icon className={`${iconSize} ${config.color} ${status === "online" ? "animate-pulse" : ""}`} />
            {showLabel && (
              <span className={config.color}>{config.label}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs"
        >
          <div className="space-y-1">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <p className="text-xs">
              <span className="text-muted-foreground">Last seen: </span>
              <span className="font-mono">{lastSeenText}</span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
