import {
  Calendar, CheckCircle2, FileText, Mail,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";

type PostpaidActivationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  monthlyFeeLabel: string;
  onConfirmed: () => void;
};

export function PostpaidActivationModal({
  open,
  onOpenChange,
  planName,
  monthlyFeeLabel,
  onConfirmed,
}: PostpaidActivationModalProps) {
  const [
    acknowledged,
    setAcknowledged,
  ] = useState(false);

  useEffect(
    () => {
      if (open)
        setAcknowledged(false);
    },
    [open],
  );

  const handleContinue = () => {
    setAcknowledged(true);
    setTimeout(
      () => {
        onOpenChange(false);
        onConfirmed();
      },
      600,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-success/10 p-3 mb-3">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle>You're on postpaid billing</DialogTitle>
            <DialogDescription>
              No payment required today. You'll be invoiced at the end of your
              billing cycle for the
              {" "}
              <span className="font-medium text-foreground">{planName}</span>
              {" "}
              plan
              (
              {monthlyFeeLabel}
              /month) plus any usage.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 w-full space-y-2 text-left">
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                Your invoice will be emailed to your billing contact at the end
                of every billing cycle.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Calendar className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                Cycle closes on the 1st of every month. First invoice issued at
                the end of your first cycle.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                Payment terms: Net 14 from invoice date.
              </p>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            disabled={acknowledged}
            className="mt-5 w-full"
            size="lg"
          >
            Got it — continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
