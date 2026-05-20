import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Wifi,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceApprovalChecklistProps {
  kycVerified: boolean;
  kycStatus: string | null;
  manufacturer: string;
  model: string | null;
  quantity: number;
  needsSim: boolean;
}

/**
 * Pre-approval readiness checklist for device requests.
 * Mirrors the SIM ApprovalChecklist visual pattern (border-2 border-dashed
 * card, structured per-check rows with badges) so both queues feel identical.
 *
 * The External Provisioning Engine itself does NOT run here — it only kicks
 * off after the platform admin clicks Approve.
 */
export function DeviceApprovalChecklist({
  kycVerified,
  kycStatus,
  manufacturer,
  model,
  quantity,
  needsSim,
}: DeviceApprovalChecklistProps) {
  const hardwareIdentified = !!manufacturer && !!model;
  const volumeFlag = quantity > 20;

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
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            kycVerified
              ? "bg-success/5 border-success/30"
              : "bg-destructive/5 border-destructive/30",
          )}
        >
          <div className="mt-0.5">
            {kycVerified ? (
              <ShieldCheck className="h-5 w-5 text-success" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">KYB/KYC Verification</p>
              {kycVerified ? (
                <Badge className="bg-success/10 text-success border-success/30">
                  Verified
                </Badge>
              ) : (
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
            <Badge variant="destructive" className="shrink-0">
              HARD BLOCK
            </Badge>
          )}
        </div>

        {/* 2. Hardware identification */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            hardwareIdentified
              ? "bg-success/5 border-success/30"
              : "bg-warning/5 border-warning/30",
          )}
        >
          <div className="mt-0.5">
            <Cpu
              className={cn(
                "h-5 w-5",
                hardwareIdentified ? "text-success" : "text-warning",
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Hardware Identification</p>
              <Badge
                className={cn(
                  hardwareIdentified
                    ? "bg-success/10 text-success border-success/30"
                    : "bg-warning/10 text-warning border-warning/30",
                )}
              >
                {hardwareIdentified ? "Identified" : "Incomplete"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hardwareIdentified
                ? `${manufacturer} · ${model}`
                : "Manufacturer or model is missing"}
            </p>
          </div>
        </div>

        {/* 3. SIM dependency */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border bg-muted/30 border-border",
          )}
        >
          <div className="mt-0.5">
            <Wifi className="h-5 w-5 text-info" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">SIM Dependency</p>
              <Badge variant="outline">
                {needsSim ? "SIM required" : "No SIM"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {needsSim
                ? "Tenant requested SIM provisioning alongside this device"
                : "Device will be provisioned without a SIM"}
            </p>
          </div>
        </div>

        {/* 4. Volume sanity */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            volumeFlag
              ? "bg-warning/5 border-warning/30"
              : "bg-success/5 border-success/30",
          )}
        >
          <div className="mt-0.5">
            <Package
              className={cn(
                "h-5 w-5",
                volumeFlag ? "text-warning" : "text-success",
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Volume Sanity Check</p>
              <Badge
                className={cn(
                  volumeFlag
                    ? "bg-warning/10 text-warning border-warning/30"
                    : "bg-success/10 text-success border-success/30",
                )}
              >
                {quantity} {quantity === 1 ? "device" : "devices"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {volumeFlag
                ? "Elevated volume — please verify before approving"
                : "Request volume is within normal parameters"}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Approval Status:</span>
            {!kycVerified ? (
              <Badge variant="destructive">Blocked - KYC Required</Badge>
            ) : (
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
