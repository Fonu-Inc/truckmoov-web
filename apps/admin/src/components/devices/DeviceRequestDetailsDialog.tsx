import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Hash,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
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
  status: string;
  priority: string | null;
  needsSim: boolean;
  quantity: number | null;
  useCase: string | null;
  requesterNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  isDemo: boolean;
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
          {` Approved · ${status.replace(/_/g, " ")}`}
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

  const isPending = request.status === "pending_review" && !request.isDemo;

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
            {`Request #${request.id.slice(0, 8)} • Submitted ${formatWithPattern(request.createdAt, "MMM d, yyyy 'at' HH:mm")}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status, Priority, KYC */}
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(request.status)}
            {priorityBadge(request.priority)}
            <KycRow status={kycStatus} />
          </div>

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
                {request.useCase
                  ? request.useCase.replace(/_/g, " ")
                  : request.needsSim
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
                {formatWithPattern(request.createdAt, "MMM d, yyyy HH:mm")}
              </p>
            </div>
          </div>

          {/* Notes */}
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
              {request.requesterNotes || <span className="text-muted-foreground italic">No additional notes provided.</span>}
            </p>
          </div>

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Rejection Reason</p>
                <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                  {request.rejectionReason}
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
