import type {
  SystemDeviceSetupKycStatus, SystemDeviceSetupStatus,
} from "@truckmoov/api/auth";
import {
  CheckCircle, Clock, ShieldAlert, ShieldCheck, ShieldQuestion, XCircle,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  formatStatusLabel,
  getStatusBucket,
  KYC_STATUS_CONFIG,
  STATUS_CONFIG,
} from "./deviceSetupConfig";

const STATUS_ICONS = {
  pending_review: Clock,
  approved: CheckCircle,
  rejected: XCircle,
} as const;

export function DeviceSetupStatusBadge({
  status, withIcon,
}: {
  status: string; withIcon?: boolean;
}) {
  const bucket = getStatusBucket(status as SystemDeviceSetupStatus);
  const Icon = withIcon ? STATUS_ICONS[bucket as keyof typeof STATUS_ICONS] : undefined;
  const config = STATUS_CONFIG[getStatusBucket(status as SystemDeviceSetupStatus) as keyof typeof STATUS_CONFIG] ?? {
    label: formatStatusLabel(status),
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge
      variant="outline"
      className={Icon ? `${config.className} gap-1` : config.className}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

export function DeviceSetupKycBadge({
  status,
  prefix,
}: {
  status: SystemDeviceSetupKycStatus;
  prefix?: string;
}) {
  const config = status ? KYC_STATUS_CONFIG[status] : undefined;
  if (!config) {
    return (
      <Badge
        variant="outline"
        className="gap-1"
      >
        <ShieldQuestion className="h-3 w-3" />
        {prefix ? `${prefix} Not Submitted` : "Not submitted"}
      </Badge>
    );
  }
  const Icon = status === "verified" ? ShieldCheck : ShieldAlert;
  return (
    <Badge
      variant="outline"
      className={`${config.className} gap-1`}
    >
      <Icon className="h-3 w-3" />
      {prefix ? `${prefix} ${config.label}` : config.label}
    </Badge>
  );
}
