import type { ProvisioningStep } from "@/lib/provisioningEngineSim";

import {
  formatDateTime,
  formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  FileText,
  Mail,
  Signal,
  Smartphone,
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

type SIMProvisioningRequest = any;

type SIMRequestDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SIMProvisioningRequest | null;
  tenantEmail?: string;
  kycStatus: string | null;
  kycVerified: boolean;
  onApprove: (overrideJustification?: string) => void;
  onReject: () => void;
  onRequestKYC: () => void;
  onInitiateActivation?: (batchId: string) => void;
  activationBatchId?: string | null;
};

export function SIMRequestDetailsDialog({
  open,
  onOpenChange,
  request,
  tenantEmail,
  kycStatus: _kycStatus,
  kycVerified,
  onApprove,
  onReject,
  onRequestKYC,
  onInitiateActivation,
  activationBatchId,
}: SIMRequestDetailsDialogProps) {
  const overrideJustification: string | undefined = undefined;

  if (!request)
    return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "kyb_required":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <Building2 className="h-3 w-3 mr-1" />
            KYB Required
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "urgent":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            Urgent
          </Badge>
        );
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SIM Request Details
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
          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            {getStatusBadge(request.status)}
            {getPriorityBadge(request.priority)}
          </div>

          {/* Provisioning Engine progress — shown from pending review onwards (same component the device modal uses) */}
          {(request.status === "pending"
            || request.status === "in_progress"
            || request.status === "approved"
            || request.status === "approved_pending_activation") && (
            <ProvisioningChecklistView
              type="sim"
              checklist={(request as unknown as { provisioning_checklist?: ProvisioningStep[] | null }).provisioning_checklist ?? null}
              startedAt={(request as unknown as { provisioning_started_at?: string | null }).provisioning_started_at ?? null}
              completedAt={(request as unknown as { provisioning_completed_at?: string | null }).provisioning_completed_at ?? null}
            />
          )}

          <Separator />

          {/* Request Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Organisation
              </p>
              <p className="font-medium">
                {request.tenant_name || request.tenant_id}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Requesting Email
              </p>
              <p className="font-medium text-sm break-all">
                {tenantEmail || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Number of SIMs
              </p>
              <p className="font-medium text-lg">
                {request.number_of_sims || 1}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Signal className="h-3 w-3" />
                Preferred Carrier
              </p>
              <p className="font-medium">
                {request.preferred_operator || "No preference"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="h-3 w-3" />
                Data Limit per SIM
              </p>
              <p className="font-medium">
                {request.requested_data_limit_mb
                  ? `${(request.requested_data_limit_mb / 1024).toFixed(1)} GB`
                  : "Standard"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Use Case
              </p>
              <p className="font-medium capitalize">
                {request.use_case?.replace(
                  /_/g,
                  " ",
                ) || "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Requested
              </p>
              <p className="font-medium">
                {formatDateTime(request.created_at)}
              </p>
            </div>
          </div>

          {/* Fonu Reference (for approved requests) */}
          {request.fonu_request_id && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Fonu Request Reference</p>
                <p className="font-mono text-xs bg-muted p-2 rounded-md">{request.fonu_request_id}</p>
              </div>
            </>
          )}

          {/* Notes */}
          {request.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md">{request.notes}</p>
              </div>
            </>
          )}

          {/* Rejection Reason */}
          {request.rejected_reason && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Rejection Reason</p>
                <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                  {request.rejected_reason}
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
          {request.status === "pending" && (
            <>
              {!kycVerified && (
                <Button
                  variant="secondary"
                  onClick={onRequestKYC}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Request KYB/KYC
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={onReject}
              >
                Reject
              </Button>
              <Button
                onClick={() => onApprove(overrideJustification)}
              >
                Approve
              </Button>
            </>
          )}
          {request.status === "approved_pending_activation" && activationBatchId && onInitiateActivation && (
            <Button onClick={() => onInitiateActivation(activationBatchId)}>
              <Cpu className="h-4 w-4 mr-2" />
              Initiate Activation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
