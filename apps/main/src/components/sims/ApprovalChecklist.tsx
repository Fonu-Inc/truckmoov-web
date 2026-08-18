import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Package,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

// Local type alias (hook deleted)
type SIMProvisioningRequest = {
  number_of_sims?: number | null;
  requested_data_limit_mb?: number | null;
  priority?: string | null;
  [key: string]: any;
};

type ApprovalChecklistProps = {
  request: SIMProvisioningRequest;
  kycVerified: boolean;
  kycStatus: string | null;
  onChecklistChange: (canApprove: boolean, overrideJustification?: string) => void;
};

type SubscriptionCheck = {
  currentSims: number;
  planLimit: number;
  planName: string;
  wouldExceed: boolean;
  loading: boolean;
};

type VolumeCheck = {
  flags: string[];
  hasFlags: boolean;
};

// Plan limits based on billing/plan-limits memory
const PLAN_LIMITS: { [key: string]: number } = {
  starter: 10,
  professional: 50,
  enterprise: 200,
  free: 5,
};

export function ApprovalChecklist({
  request,
  kycVerified,
  kycStatus,
  onChecklistChange,
}: ApprovalChecklistProps) {
  const [subscriptionCheck] = useState<SubscriptionCheck>({
    currentSims: 0,
    planLimit: PLAN_LIMITS.starter,
    planName: "Starter",
    wouldExceed: false,
    loading: false,
  });
  const [
    volumeCheck,
    setVolumeCheck,
  ] = useState<VolumeCheck>({
    flags: [],
    hasFlags: false,
  });

  // Soft warning acknowledgments
  const [
    subscriptionAcknowledged,
    setSubscriptionAcknowledged,
  ] = useState(false);
  const [
    volumeAcknowledged,
    setVolumeAcknowledged,
  ] = useState(false);
  const [
    overrideJustification,
    setOverrideJustification,
  ] = useState("");

  // Calculate volume risk flags
  useEffect(
    () => {
      const flags: string[] = [];
      const requestedSims = request.number_of_sims || 1;
      const dataLimitMb = request.requested_data_limit_mb || 0;

      if (requestedSims > 50) {
        flags.push(`High volume: ${requestedSims} SIMs requested`);
      }
      else if (requestedSims > 20) {
        flags.push(`Elevated volume: ${requestedSims} SIMs requested`);
      }

      if (dataLimitMb > 10240) { // >10GB
        flags.push(`High data limit: ${(dataLimitMb / 1024).toFixed(1)}GB per SIM`);
      }

      if (request.priority === "urgent") {
        flags.push("Urgent priority - requires expedited review");
      }

      setVolumeCheck({
        flags,
        hasFlags: flags.length > 0,
      });
    },
    [request],
  );

  // Calculate if approval is allowed
  useEffect(
    () => {
    // Hard block: KYC must be verified
      if (!kycVerified) {
        onChecklistChange(false);
        return;
      }

      // Soft warnings must be acknowledged if present
      const subscriptionNeedsAck = subscriptionCheck.wouldExceed && !subscriptionAcknowledged;
      const volumeNeedsAck = volumeCheck.hasFlags && !volumeAcknowledged;

      const needsOverride = subscriptionCheck.wouldExceed || volumeCheck.hasFlags;
      const hasRequiredJustification = !needsOverride
        || (subscriptionAcknowledged && volumeAcknowledged && overrideJustification.trim().length > 10);

      const canApprove = !subscriptionNeedsAck && !volumeNeedsAck && hasRequiredJustification;

      onChecklistChange(
        canApprove,
        needsOverride ? overrideJustification : undefined,
      );
    },
    [
      kycVerified,
      subscriptionCheck.wouldExceed,
      subscriptionAcknowledged,
      volumeCheck.hasFlags,
      volumeAcknowledged,
      overrideJustification,
      onChecklistChange,
    ],
  );

  const needsOverride = subscriptionCheck.wouldExceed || volumeCheck.hasFlags;

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Approval Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. KYB/KYC Check - Hard Block */}
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg border",
          kycVerified
            ? "bg-success/5 border-success/30"
            : "bg-destructive/5 border-destructive/30",
        )}
        >
          <div className="mt-0.5">
            {kycVerified
              ? (
                  <ShieldCheck className="h-5 w-5 text-success" />
                )
              : (
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">KYB/KYC Verification</p>
              {kycVerified
                ? (
                    <Badge className="bg-success/10 text-success border-success/30">
                      Verified
                    </Badge>
                  )
                : (
                    <Badge variant="destructive">
                      {kycStatus === "rejected" ? "Rejected" : "Not Verified"}
                    </Badge>
                  )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kycVerified
                ? "Tenant business verification is complete"
                : "Approval blocked until KYC is verified (compliance requirement)"}
            </p>
          </div>
          {!kycVerified && (
            <Badge
              variant="destructive"
              className="shrink-0"
            >
              HARD BLOCK
            </Badge>
          )}
        </div>

        {/* 2. Subscription Limit Check - Soft Warning */}
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg border",
          subscriptionCheck.wouldExceed
            ? "bg-warning/5 border-warning/30"
            : "bg-success/5 border-success/30",
        )}
        >
          <div className="mt-0.5">
            {subscriptionCheck.wouldExceed
              ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )
              : (
                  <CreditCard className="h-5 w-5 text-success" />
                )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Subscription Limit</p>
              <Badge className={cn(
                subscriptionCheck.wouldExceed
                  ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-success/10 text-success border-success/30",
              )}
              >
                {subscriptionCheck.currentSims}
                {" "}
                +
                {request.number_of_sims || 1}
                {" "}
                /
                {subscriptionCheck.planLimit}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscriptionCheck.wouldExceed
                ? `Would exceed ${subscriptionCheck.planName} plan limit (${subscriptionCheck.planLimit} SIMs)`
                : `Within ${subscriptionCheck.planName} plan capacity`}
            </p>

            {subscriptionCheck.wouldExceed && (
              <div className="mt-3 flex items-center gap-2">
                <Checkbox
                  id="sub-ack"
                  checked={subscriptionAcknowledged}
                  onCheckedChange={checked => setSubscriptionAcknowledged(!!checked)}
                />
                <Label
                  htmlFor="sub-ack"
                  className="text-xs cursor-pointer"
                >
                  I acknowledge exceeding subscription limits
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* 3. Volume Risk Flags - Soft Warning */}
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg border",
          volumeCheck.hasFlags
            ? "bg-warning/5 border-warning/30"
            : "bg-success/5 border-success/30",
        )}
        >
          <div className="mt-0.5">
            {volumeCheck.hasFlags
              ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )
              : (
                  <Package className="h-5 w-5 text-success" />
                )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Volume Sanity Check</p>
              <Badge className={cn(
                volumeCheck.hasFlags
                  ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-success/10 text-success border-success/30",
              )}
              >
                {volumeCheck.hasFlags ? `${volumeCheck.flags.length} Flag(s)` : "No Flags"}
              </Badge>
            </div>

            {volumeCheck.hasFlags
              ? (
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {volumeCheck.flags.map((flag, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-3 w-3 text-warning shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                )
              : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Request volume is within normal parameters
                  </p>
                )}

            {volumeCheck.hasFlags && (
              <div className="mt-3 flex items-center gap-2">
                <Checkbox
                  id="vol-ack"
                  checked={volumeAcknowledged}
                  onCheckedChange={checked => setVolumeAcknowledged(!!checked)}
                />
                <Label
                  htmlFor="vol-ack"
                  className="text-xs cursor-pointer"
                >
                  I have reviewed and acknowledge the risk flags
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Override Justification - Required when soft warnings acknowledged */}
        {needsOverride && (subscriptionAcknowledged || volumeAcknowledged) && (
          <div className="space-y-2 pt-2">
            <Label
              htmlFor="justification"
              className="text-sm font-medium"
            >
              Override Justification
              {" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Provide business justification for approving despite warnings (min 10 characters)..."
              value={overrideJustification}
              onChange={e => setOverrideJustification(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This will be logged for audit purposes
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Approval Status:</span>
            {!kycVerified
              ? (
                  <Badge variant="destructive">Blocked - KYC Required</Badge>
                )
              : needsOverride
                ? (
                    subscriptionAcknowledged && volumeAcknowledged && overrideJustification.trim().length > 10
                      ? (
                          <Badge className="bg-warning/10 text-warning border-warning/30">
                            Ready (with override)
                          </Badge>
                        )
                      : (
                          <Badge variant="outline">Pending Acknowledgments</Badge>
                        )
                  )
                : (
                    <Badge className="bg-success/10 text-success border-success/30">
                      Ready to Approve
                    </Badge>
                  )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
