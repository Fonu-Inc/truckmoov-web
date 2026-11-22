import type { ColumnDef } from "@tanstack/react-table";
import type { SystemSimBatch } from "@truckmoov/api/auth";
import { formatDayMonthTime } from "@truckmoov/app-core/utils/time-utils";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  ActivationStatusBadge,
  ProgressCell,
} from "./ActivationBadges";
import {
  canRetryBatch,
  emptyValue,
} from "./activationShared";

type ColumnOptions = {
  canRetry: boolean;
  retryPending: boolean;
  onRetry: (batch: SystemSimBatch) => void;
  onDetails: (batch: SystemSimBatch) => void;
};

export function getActivationColumns({
  canRetry,
  retryPending,
  onRetry,
  onDetails,
}: ColumnOptions): ColumnDef<SystemSimBatch>[] {
  return [
    {
      id: "tenant",
      header: "Tenant",
      meta: { className: "min-w-[220px]" },
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.tenantName || row.original.tenantId.slice(
            0,
            8,
          )}
        </span>
      ),
    },
    {
      id: "quantity",
      header: "Devices Requested",
      meta: { className: "min-w-[150px]" },
      cell: ({ row }) => <span className="font-mono">{row.original.quantity}</span>,
    },
    {
      id: "operator",
      header: "Carrier",
      meta: { className: "min-w-[150px]" },
      cell: ({ row }) => <span className="text-sm">{row.original.operator || "Any"}</span>,
    },
    {
      id: "progress",
      header: "Progress",
      meta: { className: "min-w-[170px]" },
      cell: ({ row }) => <ProgressCell batch={row.original} />,
    },
    {
      id: "status",
      header: "Status",
      meta: { className: "min-w-[150px]" },
      cell: ({ row }) => <ActivationStatusBadge status={row.original.status} />,
    },
    {
      id: "created",
      header: "Created",
      meta: { className: "min-w-[150px]" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDayMonthTime(
            row.original.createdAt,
            emptyValue,
          )}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "min-w-[160px] text-right" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          {canRetry && canRetryBatch(row.original.status) && (
            <Button
              size="sm"
              variant="outline"
              disabled={retryPending}
              onClick={() => onRetry(row.original)}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDetails(row.original)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];
}
