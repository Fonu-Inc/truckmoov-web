import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Smartphone,
  Signal,
  Database,
  Building2,
  FileText,
  Cpu,
} from "lucide-react";
import { SIMProvisioningRequest, DeviceMappingRow } from "@/hooks/useFonuSIM";
import { SIMRequestRiskFlags } from "./SIMRequestRiskFlags";
import { DeviceMappingPreview } from "./DeviceMappingPreview";
import { ApprovalChecklist } from "./ApprovalChecklist";
import { format } from "date-fns";

interface SIMRequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: SIMProvisioningRequest | null;
  kycStatus: string | null;
  kycVerified: boolean;
  onApprove: (overrideJustification?: string) => void;
  onReject: () => void;
  onRequestKYC: () => void;
  onInitiateActivation?: (batchId: string) => void;
  activationBatchId?: string | null;
}

export function SIMRequestDetailsDialog({
  open,
  onOpenChange,
  request,
  kycStatus,
  kycVerified,
  onApprove,
  onReject,
  onRequestKYC,
  onInitiateActivation,
  activationBatchId,
}: SIMRequestDetailsDialogProps) {
  const [canApprove, setCanApprove] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState<string | undefined>();

  const handleChecklistChange = useCallback((approved: boolean, justification?: string) => {
    setCanApprove(approved);
    setOverrideJustification(justification);
  }, []);

  if (!request) return null;

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

  const deviceMappingData = request.device_mapping_data as DeviceMappingRow[] | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SIM Request Details
          </DialogTitle>
          <DialogDescription>
            Request #{request.id.slice(0, 8)} • Submitted{" "}
            {format(new Date(request.created_at), "MMM d, yyyy 'at' HH:mm")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            {getStatusBadge(request.status)}
            {getPriorityBadge(request.priority)}
          </div>

          {/* Approval Checklist - replaces simple risk flags for pending requests */}
          {request.status === "pending" ? (
            <ApprovalChecklist
              request={request}
              kycVerified={kycVerified}
              kycStatus={kycStatus}
              onChecklistChange={handleChecklistChange}
            />
          ) : (
            <SIMRequestRiskFlags request={request} kycStatus={kycStatus} />
          )}

          <Separator />

          {/* Request Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Tenant
              </p>
              <p className="font-medium">
                {request.tenant_name || request.tenant_id}
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
                Preferred Operator
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
                {request.use_case?.replace(/_/g, " ") || "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deployment Timeline
              </p>
              <p className="font-medium capitalize">
                {request.deployment_timeline?.replace(/_/g, " ") || "Not specified"}
              </p>
            </div>
          </div>

          {/* Plan & ICCID if available */}
          {(request.requested_plan || request.iccid) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {request.requested_plan && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium">{request.requested_plan}</p>
                  </div>
                )}
                {request.iccid && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ICCID</p>
                    <p className="font-mono text-xs">{request.iccid}</p>
                  </div>
                )}
                {request.msisdn && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">MSISDN</p>
                    <p className="font-mono">{request.msisdn}</p>
                  </div>
                )}
              </div>
            </>
          )}

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

          {/* Device Mapping Preview */}
          {deviceMappingData && deviceMappingData.length > 0 && (
            <>
              <Separator />
              <DeviceMappingPreview data={deviceMappingData} />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {request.status === "pending" && (
            <>
              {!kycVerified && (
                <Button variant="secondary" onClick={onRequestKYC}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Request KYB/KYC
                </Button>
              )}
              <Button variant="destructive" onClick={onReject}>
                Reject
              </Button>
              <Button 
                onClick={() => onApprove(overrideJustification)} 
                disabled={!canApprove}
              >
                {overrideJustification ? 'Approve with Override' : 'Approve'}
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
