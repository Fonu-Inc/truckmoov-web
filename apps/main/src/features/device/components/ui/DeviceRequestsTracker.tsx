import type { ColumnDef } from "@tanstack/react-table";
import type { OnboardingApplicationSummary } from "@truckmoov/api/auth";
import type { DeviceSetupRequest } from "@truckmoov/api/fleet";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingStatusQueryOptions } from "@truckmoov/api/auth";
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

// Setup-request statuses mapped onto the design's labels and badge styles. The
// onboarding status map adds the payment and installation stages, which only
// the onboarding application has.
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
  awaiting_payment: {
    label: "Awaiting Payment", variant: "outline", note: "Payment is pending. Installation is scheduled once payment is confirmed.",
  },
  ready_for_installation: {
    label: "Ready for Installation", variant: "secondary", note: "Payment received. Installation is being scheduled.",
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

const INSTALLATION_STATUS_LABELS: Record<string, string> = {
  unassigned: "Awaiting Installer",
  assigned: "Installer Assigned",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  overdue: "Overdue",
  issue_reported: "Issue Reported",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Where an onboarding device request has reached, expressed as a request status. */
function onboardingStatusKey(application: OnboardingApplicationSummary): string {
  if (application.status === "rejected")
    return "rejected";
  if (application.status !== "approved")
    return "pending_review";

  switch (application.stage) {
    case "payment":
      return "awaiting_payment";
    case "installation_scheduling":
      return "ready_for_installation";
    case "installation":
      return "in_progress";
    case "connectivity_verification":
    case "fleet_ready":
      return "provisioned";
    default:
      return "approved";
  }
}

function OnboardingRequestDetailsDialog({
  application, onOpenChange,
}: {
  application: OnboardingApplicationSummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  const info = application ? statusInfo(onboardingStatusKey(application)) : null;
  const useCases = application?.deviceRequests
    .map(request => request.useCase)
    .filter(Boolean)
    .join(" · ");
  const notes = application?.deviceRequests
    .map(request => request.notes)
    .filter(Boolean)
    .join("\n");

  return (
    <Dialog
      open={Boolean(application)}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        {application && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {application.requestedDevices}
                {" "}
                × devices
                <Badge variant={info?.variant}>{info?.label}</Badge>
              </DialogTitle>
              <DialogDescription>
                Reference
                {" "}
                {application.reference}
                {" "}
                · submitted
                {" "}
                {dateOnly(application.submittedAt ?? application.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-xl border border-border/60 p-4">
              <p className="text-sm font-semibold">Request details</p>
              <Detail
                label="Application Reference"
                value={application.reference}
              />
              <Detail
                label="Vehicles on Application"
                value={application.vehicleCount}
              />
              <Detail
                label="Number of Devices Requested"
                value={application.requestedDevices}
              />
              <Detail
                label="Use Case"
                value={useCases}
              />
              <Detail
                label="Additional Notes"
                value={<span className="whitespace-pre-line">{notes}</span>}
              />
            </div>
            {application.installation && (
              <div className="space-y-2 rounded-xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Installation</p>
                <Detail
                  label="Order"
                  value={application.installation.orderNumber}
                />
                <Detail
                  label="Status"
                  value={INSTALLATION_STATUS_LABELS[application.installation.status]
                    ?? application.installation.status.replace(
                      /_/g,
                      " ",
                    )}
                />
                <Detail
                  label="Scheduled"
                  value={application.installation.scheduledDate
                    ? dateOnly(application.installation.scheduledDate)
                    : "Not scheduled"}
                />
                <Detail
                  label="Time Slot"
                  value={application.installation.timeSlotLabel ?? application.installation.timeSlot}
                />
              </div>
            )}
            {info?.note && <p className="text-sm text-muted-foreground">{info.note}</p>}
            <DialogFooter>
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

type RequestRow = {
  id: string;
  kind: "setup" | "onboarding";
  reference: string;
  quantity: number;
  submittedAt: string | null;
  statusKey: string;
  itemTitle: string;
  itemSubtitle: string;
  charges: string;
};

type OpenRequest
  = | {
    kind: "setup"; id: string;
  }
  | { kind: "onboarding" }
  | null;

export function DeviceRequestsTracker() {
  const requestsQuery = useDeviceSetupRequests();
  const onboardingQuery = useQuery(getOnboardingStatusQueryOptions());
  const requests: DeviceSetupRequest[] = requestsQuery.data?.data ?? [];
  const application = onboardingQuery.data?.data.application ?? null;
  const [
    openRequest,
    setOpenRequest,
  ] = useState<OpenRequest>(null);

  const onboardingRow: RequestRow | null = application
    && application.status !== "draft"
    && application.stage !== "fleet_ready"
    && application.requestedDevices > 0
    ? {
        id: application.id,
        kind: "onboarding",
        reference: application.reference,
        quantity: application.requestedDevices,
        submittedAt: application.submittedAt ?? application.createdAt,
        statusKey: onboardingStatusKey(application),
        itemTitle: `${application.requestedDevices} × devices`,
        itemSubtitle: application.deviceRequests
          .map(request => request.useCase)
          .filter(Boolean)
          .join(" · ") || "Onboarding request",
        charges: "—",
      }
    : null;

  const rows: RequestRow[] = [
    ...(onboardingRow ? [onboardingRow] : []),
    ...requests.map(request => ({
      id: request.id,
      kind: "setup" as const,
      reference: reference(request.id),
      quantity: request.quantity,
      submittedAt: request.createdAt,
      statusKey: request.status,
      itemTitle: `${request.quantity} × devices`,
      itemSubtitle: request.useCase,
      charges: "—",
    })),
  ];

  const requestColumns: ColumnDef<RequestRow>[] = [
    {
      id: "reference",
      header: "Reference",
      meta: { className: "font-mono text-xs" },
      cell: ({ row }) => row.original.reference,
    },
    {
      id: "item",
      header: "Item",
      enableSorting: false,
      cell: ({ row }) => (
        <>
          <p className="font-medium">{row.original.itemTitle}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.itemSubtitle}</p>
        </>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      meta: { className: "text-sm" },
      cell: ({ row }) => row.original.submittedAt
        ? dateOnly(row.original.submittedAt)
        : "—",
    },
    {
      // ponytail: no quotation/charges field on setup requests yet.
      id: "charges",
      header: "Charges",
      enableSorting: false,
      meta: { className: "text-sm text-muted-foreground" },
      cell: ({ row }) => row.original.charges,
    },
    {
      accessorKey: "statusKey",
      header: "Status",
      cell: ({ row }) => {
        const info = statusInfo(row.original.statusKey);
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
          onClick={() => setOpenRequest(
            row.original.kind === "onboarding"
              ? { kind: "onboarding" }
              : {
                  kind: "setup", id: row.original.id,
                },
          )}
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
            data={rows}
            isLoading={requestsQuery.isLoading || onboardingQuery.isLoading}
            isError={requestsQuery.isError}
            errorMessage={requestsQuery.error?.message}
            onRetry={() => void requestsQuery.refetch()}
            emptyState="No device requests yet."
          />
        </div>
      </CardContent>
      <RequestDetailsDialog
        requestId={openRequest?.kind === "setup" ? openRequest.id : null}
        onOpenChange={open => !open && setOpenRequest(null)}
      />
      <OnboardingRequestDetailsDialog
        application={openRequest?.kind === "onboarding" ? application : null}
        onOpenChange={open => !open && setOpenRequest(null)}
      />
    </Card>
  );
}
