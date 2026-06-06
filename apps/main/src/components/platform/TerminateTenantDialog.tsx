import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TenantData } from "@/hooks/useTenants";

interface Props {
  tenant: TenantData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTerminated?: () => void;
}

export function TerminateTenantDialog({
  tenant,
  open,
  onOpenChange,
  onTerminated,
}: Props) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    confirmation === "TERMINATE" && reason.trim().length >= 10 && !submitting;

  const handleClose = (next: boolean) => {
    if (submitting) return;
    if (!next) {
      setReason("");
      setConfirmation("");
    }
    onOpenChange(next);
  };

  const handleTerminate = async () => {
    toast.info('Coming soon');
    return;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Terminate Tenant
          </DialogTitle>
          <DialogDescription>
            Permanently terminate <strong>{tenant.name}</strong>. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/40">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>This is irreversible</AlertTitle>
          <AlertDescription className="text-xs space-y-1 mt-2">
            <p>• All active SIMs will be terminated at the MTN HLR.</p>
            <p>• All WhatsApp numbers will be retired from the WABA.</p>
            <p>
              • A data export will be generated and emailed to the tenant's
              primary contact (link valid for 30 days).
            </p>
            <p>
              • Tenant data will be purged after 30 days per NDPR policy unless
              NCC retention applies.
            </p>
            <p>• Terminated tenants cannot be reinstated.</p>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Termination reason (required)</Label>
            <Textarea
              id="reason"
              placeholder="Provide a clear, auditable reason for termination..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. Recorded permanently in the audit trail.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold">TERMINATE</span> to
              confirm
            </Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="TERMINATE"
              autoComplete="off"
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleTerminate}
            disabled={!canSubmit}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Permanently Terminate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
