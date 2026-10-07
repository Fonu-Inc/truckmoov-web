import type { ColumnDef } from "@tanstack/react-table";
import type { DeviceSetupRequest } from "@truckmoov/api/fleet";
import { useQuery } from "@tanstack/react-query";
import {
  getDeviceSetupRequestQueryOptions,
  useDeviceSetupRequests,
  useUpdateDeviceSetupRequestStatus,
} from "@truckmoov/api/fleet";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  ClipboardList, Eye, Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// The API's setup-request statuses mapped onto the design's labels and badge styles.
// ponytail: the design also has Awaiting Payment / Ready for Installation — the API has
// no payment or installation stages, so those never appear.
const STATUS: Record<string, {
  label: string; variant: BadgeVariant; note: string;
}> = {
  pending_review: {
    label: "Under Review", variant: "outline", note: "Waiting for approval. Once approved, your devices are prepared for installation.",
  },
  approved: {
    label: "Approved", variant: "secondary", note: "Approved. Your devices are being prepared.",
  },
  assigned: {
    label: "Approved", variant: "secondary", note: "Approved and assigned for provisioning.",
  },
  in_progress: {
    label: "Installation In Progress", variant: "secondary", note: "Devices are being provisioned and installed.",
  },
  provisioned: {
    label: "Completed", variant: "default", note: "Installation is complete — the devices are in your active list.",
  },
  active: {
    label: "Completed", variant: "default", note: "Installation is complete — the devices are in your active list.",
  },
  rejected: {
    label: "Rejected", variant: "destructive", note: "This request was rejected.",
  },
  cancelled: {
    label: "Cancelled", variant: "outline", note: "You cancelled this request.",
  },
};

function statusInfo(status: string) {
  return STATUS[status] ?? {
    label: status.replace(
      /_/g,
      " ",
    ), variant: "outline" as const, note: "",
  };
}

// ponytail: the API has no request reference number — this is a display id derived from
// the request id. Use the server reference once it exists.
function reference(id: string) {
  return `DVR-${id.replace(
    /-/g,
    "",
  ).slice(
    0,
    6,
  ).toUpperCase()}`;
}

function dateOnly(iso: string) {
  return formatWithPattern(
    iso,
    "MMM d, yyyy",
  );
}

function Detail({
  label, value,
}: {
  label: string; value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function RequestDetailsDialog({
  requestId, onOpenChange,
}: {
  requestId: string | null; onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useQuery({
    ...getDeviceSetupRequestQueryOptions(requestId ?? ""),
    enabled: Boolean(requestId),
  });
  const cancelRequest = useUpdateDeviceSetupRequestStatus();
  const request = detailQuery.data?.data;
  const info = request ? statusInfo(request.status) : null;

  const cancel = () => {
    if (!request)
      return;
    cancelRequest.mutate(
      {
        id: request.id, data: { status: "cancelled" },
      },
      {
        onSuccess: () => {
          toast.success("Request cancelled");
          onOpenChange(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={Boolean(requestId)}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        {!request
          ? (
              <div className="flex justify-center py-10">
                {detailQuery.isError
                  ? <p className="text-sm text-destructive">{detailQuery.error.message}</p>
                  : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
              </div>
            )
          : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {request.quantity}
                    {" "}
                    × devices
                    <Badge variant={info?.variant}>{info?.label}</Badge>
                  </DialogTitle>
                  <DialogDescription>
                    Reference
                    {" "}
                    {reference(request.id)}
                    {" "}
                    · submitted
                    {" "}
                    {formatWithPattern(
                      request.createdAt,
                      "MMM d, yyyy 'at' HH:mm",
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 rounded-xl border border-border/60 p-4">
                  <p className="text-sm font-semibold">Request details</p>
                  <Detail
                    label="Number of Devices Requested"
                    value={request.quantity}
                  />
                  <Detail
                    label="Manufacturer"
                    value={request.manufacturer}
                  />
                  <Detail
                    label="Tracker Type"
                    value={request.trackerType}
                  />
                  <Detail
                    label="Location"
                    value={[
                      request.city,
                      request.state,
                    ].filter(Boolean).join(", ")}
                  />
                  <Detail
                    label="Use Case"
                    value={request.useCase}
                  />
                  <Detail
                    label="Additional Notes"
                    value={<span className="whitespace-pre-line">{request.notes}</span>}
                  />
                </div>
                {info?.note && <p className="text-sm text-muted-foreground">{info.note}</p>}
                <DialogFooter>
                  {request.status === "pending_review" && (
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={cancel}
                      disabled={cancelRequest.isPending}
                    >
                      {cancelRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel request
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
      </DialogContent>
    </Dialog>
  );
}

export function DeviceRequestsTracker() {
  const requestsQuery = useDeviceSetupRequests();
  const requests: DeviceSetupRequest[] = requestsQuery.data?.data ?? [];
  const [
    openId,
    setOpenId,
  ] = useState<string | null>(null);

  const requestColumns: ColumnDef<DeviceSetupRequest>[] = [
    {
      id: "reference",
      header: "Reference",
      meta: { className: "font-mono text-xs" },
      cell: ({ row }) => reference(row.original.id),
    },
    {
      id: "item",
      header: "Item",
      enableSorting: false,
      cell: ({ row }) => (
        <>
          <p className="font-medium">
            {row.original.quantity}
            {" "}
            × devices
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.useCase}</p>
        </>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      meta: { className: "text-sm" },
      cell: ({ row }) => dateOnly(row.original.createdAt),
    },
    {
      // ponytail: no quotation/charges field on setup requests yet.
      id: "charges",
      header: "Charges",
      enableSorting: false,
      meta: { className: "text-sm text-muted-foreground" },
      cell: () => "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const info = statusInfo(row.original.status);
        return <Badge variant={info.variant}>{info.label}</Badge>;
      },
    },
    {
      id: "action",
      header: "Action",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenId(row.original.id)}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>My Device Requests</CardTitle>
            <CardDescription>
              Track every device request from Platform Admin approval through payment and installation. Devices join your active list once installation is complete.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/60">
          <DataTable
            columns={requestColumns}
            data={requests}
            isLoading={requestsQuery.isLoading}
            isError={requestsQuery.isError}
            errorMessage={requestsQuery.error?.message}
            onRetry={() => void requestsQuery.refetch()}
            emptyState="No device requests yet."
          />
        </div>
      </CardContent>
      <RequestDetailsDialog
        requestId={openId}
        onOpenChange={open => !open && setOpenId(null)}
      />
    </Card>
  );
}
