import type { SystemSimBatch } from "@truckmoov/api/auth";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/shadcn/badge";

export const emptyValue = "-";

export const ACTING_ROLES = [
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
];

export const statusOptions = [
  {
    value: "all",
    label: "All Status",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "partially_completed",
    label: "Partial",
  },
  {
    value: "failed",
    label: "Failed",
  },
];

export function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


export function getProgressPercentage(batch: SystemSimBatch) {
  if (batch.status === "pending")
    return 0;
  if (batch.status === "completed")
    return 100;
  if (batch.quantity <= 0)
    return 0;
  return Math.min(
    Math.round(((batch.simsActivated + batch.simsFailed) / batch.quantity) * 100),
    100,
  );
}

export function canRetryBatch(status: string) {
  return status === "failed" || status === "partially_completed";
}

export function ActivationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="border-muted bg-muted text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "in_progress":
    case "activation_in_progress":
      return (
        <Badge className="border-primary/30 bg-primary/10 text-primary">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge className="border-success/30 bg-success/10 text-success">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "partially_completed":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Needs Attention
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || emptyValue}</Badge>;
  }
}

export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [
    debounced,
    setDebounced,
  ] = useState(value);
  useEffect(
    () => {
      const timer = window.setTimeout(
        setDebounced,
        delayMs,
        value,
      );
      return () => window.clearTimeout(timer);
    },
    [
      value,
      delayMs,
    ],
  );
  return debounced;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
