import {
  Building2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { useAuthStore } from "@/stores/authStore";

type KYCRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string | null;
  requestId: string;
  onComplete: () => void;
};

export function KYCRequestDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  requestId,
  onComplete,
}: KYCRequestDialogProps) {
  const { user } = useAuthStore();
  const [
    reason,
    setReason,
  ] = useState("");
  const [
    processing,
    setProcessing,
  ] = useState(false);

  const handleSubmit = async () => {
    toast.info("Coming soon");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Request KYB/KYC Completion
          </DialogTitle>
          <DialogDescription>
            Send a notification to
            {" "}
            {tenantName || "the tenant"}
            {" "}
            requesting
            completion of their business verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-sm text-warning">
            This SIM request cannot be approved until the tenant completes
            KYB/KYC verification. The request will be marked as
            {" "}
            <strong>KYB Required</strong>
            .
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason / Instructions for the Tenant
            </Label>
            <Textarea
              id="reason"
              placeholder="Please complete your business verification by uploading the required documents..."
              value={reason}
              onChange={e => setReason(e.target.value)}
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
          <Button
            onClick={handleSubmit}
            disabled={processing || !reason.trim()}
          >
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
