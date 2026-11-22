import type { SystemSimBatch } from "@truckmoov/api/auth";
import {
  useEffect, useState,
} from "react";

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
