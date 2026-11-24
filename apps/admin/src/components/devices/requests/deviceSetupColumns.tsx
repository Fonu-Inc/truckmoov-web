import type { ColumnDef } from "@tanstack/react-table";
import type { SystemDeviceSetupRequest } from "@truckmoov/api/auth";
import {
  formatRelative, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Eye,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { DeviceSetupStatusBadge } from "./DeviceSetupBadges";

type Actions = {
  isMutating: boolean;
  approvingId: string | null;
  assigningId: string | null;
  onView: (request: SystemDeviceSetupRequest) => void;
  onApprove: (request: SystemDeviceSetupRequest) => void;
  onReject: (request: SystemDeviceSetupRequest) => void;
  onAssign: (request: SystemDeviceSetupRequest) => void;
};

export function getDeviceSetupColumns(actions: Actions): ColumnDef<SystemDeviceSetupRequest>[] {
  return [
    {
      id: "organisation",
      header: "Organisation",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.organisationName ?? row.original.tenantId}
        </div>
      ),
    },
    {
      id: "email",
      header: "Request Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.requestingEmail ?? "-"}</span>
      ),
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      cell: ({ row }) => <span className="font-medium">{row.original.manufacturer}</span>,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <DeviceSetupStatusBadge status={row.original.status} />,
    },
    {
      id: "date",
      header: "Date Requested",
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm text-muted-foreground">
          <div>
            {formatWithPattern(
              row.original.createdAt,
              "MMM d, yyyy",
            )}
          </div>
          <div className="text-xs opacity-70">{formatRelative(row.original.createdAt)}</div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const request = row.original;
        const isPending = request.status === "pending_review";
        const isApproved = request.status === "approved";
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => actions.onView(request)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View details
            </Button>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={actions.isMutating}
                  onClick={() => actions.onApprove(request)}
                >
                  {actions.approvingId === request.id
                    ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    : <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={actions.isMutating}
                  onClick={() => actions.onReject(request)}
                >
                  <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
            {isApproved && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={actions.isMutating}
                onClick={() => actions.onAssign(request)}
              >
                {actions.assigningId === request.id
                  ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                Assign to Me
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
