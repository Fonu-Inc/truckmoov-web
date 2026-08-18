import type { ProvisioningStep } from "@/lib/provisioningEngineSim";
import {
  formatDateTime, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  FileText,
  Hash,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import { ProvisioningChecklistView } from "@/components/provisioning/ProvisioningChecklistView";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";

import { Separator } from "@/components/shadcn/separator";

export type DeviceReqDetails = {
  id: string;
  tenant_id: string;
  requesting_org_id: string;
  requester_user_id: string;
  requester_name: string | null;
  manufacturer: string;
  model: string | null;
  imei: string;
  needs_sim: boolean;
  vehicle_name: string | null;
  priority: string | null;
  status: string;
  rejection_reason: string | null;
  configurator_notes: string | null;
  resulting_device_id: string | null;
  created_at: string;
  quantity?: number | null;
  use_case?: string | null;
  provisioning_checklist?: ProvisioningStep[] | null;
  provisioning_started_at?: string | null;
  provisioning_completed_at?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DeviceReqDetails | null;
  tenantName: string;
  tenantEmail?: string;
  kycStatus: string | null;
  onApprove: () => void;
  onReject: () => void;
};

function statusBadge(status: string) {
  switch (status) {
    case "pending_review":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          {" "}
          Pending Review
        </Badge>
      );
    case "assigned":
    case "in_progress":
    case "awaiting_heartbeat":
      return (
        <Badge className="bg-info/10 text-info border-info/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          {" "}
          Approved ·
          {status.replace(
            /_/g,
            " ",
          )}
        </Badge>
      );
    case "active":
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          {" "}
          Active
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {" "}
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function priorityBadge(p: string | null) {
  const v = (p || "normal").toLowerCase();
  if (v === "urgent")
    return <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>;
  if (v === "high")
    return <Badge variant="destructive">High Priority</Badge>;
  if (v === "low") {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        Low
      </Badge>
    );
  }
  return <Badge variant="outline">Normal</Badge>;
}

function KycRow({ status }: { status: string | null }) {
  if (status === "verified") {
    return (
      <Badge
        variant="outline"
        className="bg-success/10 text-success border-success/30 gap-1"
      >
        <ShieldCheck className="h-3 w-3" />
        {" "}
        KYC Verified
      </Badge>
    );
  }
  if (status === "pending" || status === "submitted") {
    return (
      <Badge
        variant="outline"
        className="bg-warning/10 text-warning border-warning/30 gap-1"
      >
        <ShieldAlert className="h-3 w-3" />
        {" "}
        KYC Pending
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="bg-destructive/10 text-destructive border-destructive/30 gap-1"
      >
        <ShieldAlert className="h-3 w-3" />
        {" "}
        KYC Rejected
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1"
    >
      <ShieldQuestion className="h-3 w-3" />
      {" "}
      KYC Not Submitted
    </Badge>
  );
}

export function DeviceRequestDetailsDialog({
  open,
  onOpenChange,
  request,
  tenantName,
  tenantEmail,
  kycStatus,
  onApprove,
  onReject,
}: Props) {
  if (!request)
    return null;

  const isPending = request.status === "pending_review";
  const showEngine
    = request.status === "pending_review"
      || request.status === "in_progress"
      || request.status === "awaiting_heartbeat"
      || request.status === "active"
      || (Array.isArray(request.provisioning_checklist)
        && request.provisioning_checklist.length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Device Request Details
          </DialogTitle>
          <DialogDescription>
            Request #
            {request.id.slice(
              0,
              8,
            )}
            {" "}
            • Submitted
            {" "}
            {formatWithPattern(
              request.created_at,
              "MMM d, yyyy 'at' HH:mm",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status, Priority, KYC */}
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(request.status)}
            {priorityBadge(request.priority)}
            <KycRow status={kycStatus} />
          </div>

          {/* Provisioning Engine progress (post-approval) */}
          {showEngine && (
            <ProvisioningChecklistView
              type="device"
              checklist={request.provisioning_checklist}
              startedAt={request.provisioning_started_at}
              completedAt={request.provisioning_completed_at}
            />
          )}

          <Separator />

          {/* Request Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {" "}
                Organisation
              </p>
              <p className="font-medium">{tenantName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {" "}
                Requesting Email
              </p>
              <p className="font-medium text-sm break-all">{tenantEmail || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                {" "}
                Manufacturer
              </p>
              <p className="font-medium">{request.manufacturer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                {" "}
                Model
              </p>
              <p className="font-medium">{request.model || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {" "}
                Number of Devices
              </p>
              <p className="font-medium text-lg">{request.quantity ?? 1}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                {" "}
                Use Case
              </p>
              <p className="font-medium capitalize">
                {request.use_case
                  ? request.use_case.replace(
                      /_/g,
                      " ",
                    )
                  : request.needs_sim
                    ? "Telemetry + SIM provisioning"
                    : "Telemetry only"}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {" "}
                Date Submitted
              </p>
              <p className="font-medium">
                {formatDateTime(request.created_at)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
              {request.configurator_notes || <span className="text-muted-foreground italic">No additional notes provided.</span>}
            </p>
          </div>

          {/* Rejection Reason */}
          {request.rejection_reason && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Rejection Reason</p>
                <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                  {request.rejection_reason}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {isPending && (
            <>
              <Button
                variant="destructive"
                onClick={onReject}
              >
                Reject
              </Button>
              <Button onClick={onApprove}>Approve</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
