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
import { Textarea } from "@/components/shadcn/textarea";
import { Label } from "@/components/shadcn/label";
import { Loader2, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface UpgradeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  tenantId: string;
  currentVehicleCount: number;
  onSubmitted: () => void;
}

export function UpgradeRequestDialog({
  open,
  onOpenChange,
  orgId,
  tenantId,
  currentVehicleCount,
  onSubmitted,
}: UpgradeRequestDialogProps) {
  const { user } = useAuthStore();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    toast.info('Coming soon');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Request Fleet Provider Upgrade
          </DialogTitle>
          <DialogDescription>
            Upgrading to Fleet Provider removes the vehicle cap and unlocks full fleet management capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p><span className="font-medium">Current type:</span> Owner-Operator</p>
            <p><span className="font-medium">Upgrade to:</span> Fleet Provider</p>
            <p><span className="font-medium">Current vehicles:</span> {currentVehicleCount}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upgrade-reason">Reason for upgrade (optional)</Label>
            <Textarea
              id="upgrade-reason"
              placeholder="e.g. Growing fleet, need to add more trucks..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
