import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KYCRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string | null;
  requestId: string;
  onComplete: () => void;
}

export function KYCRequestDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  requestId,
  onComplete,
}: KYCRequestDialogProps) {
  const { user } = useAuthStore();
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the KYB/KYC request");
      return;
    }

    setProcessing(true);
    try {
      // Update the request status to kyb_required
      const { error: updateError } = await supabase
        .from("sim_provisioning_requests")
        .update({
          status: "kyb_required",
          notes: `KYB/KYC Required: ${reason}`,
        } as any)
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Log the KYC notification
      await supabase.from("kyc_notification_logs").insert({
        tenant_id: tenantId,
        tenant_name: tenantName,
        tenant_email: "", // Would need to fetch from tenant_business_info
        notification_type: "kyc_required",
        document_type: "sim_provisioning",
        document_name: "SIM Provisioning Request",
        rejection_reason: reason,
        delivery_status: "pending",
        sent_by: user?.id || null,
      });

      // Log to security audit: who requested KYB/KYC completion
      await supabase.from("security_audit_logs").insert({
        event_type: "kyb_requested",
        severity: "info",
        description: `KYB/KYC completion requested for ${tenantName || tenantId} regarding SIM provisioning`,
        user_id: user?.id || null,
        user_name: user?.name || "Platform Admin",
        tenant_id: tenantId,
        tenant_name: tenantName,
        metadata: {
          request_id: requestId,
          reason: reason,
        },
      });

      toast.success("KYB/KYC Completion Request Sent", {
        description: `${tenantName || "Tenant"} has been notified to complete verification.`,
      });

      onComplete();
      onOpenChange(false);
      setReason("");
    } catch (err) {
      console.error("Error requesting KYC:", err);
      toast.error("Failed to send KYC request");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Request KYB/KYC Completion
          </DialogTitle>
          <DialogDescription>
            Send a notification to {tenantName || "the tenant"} requesting
            completion of their business verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-sm text-warning">
            This SIM request cannot be approved until the tenant completes
            KYB/KYC verification. The request will be marked as{" "}
            <strong>KYB Required</strong>.
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason / Instructions for the Tenant
            </Label>
            <Textarea
              id="reason"
              placeholder="Please complete your business verification by uploading the required documents..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={processing || !reason.trim()}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



