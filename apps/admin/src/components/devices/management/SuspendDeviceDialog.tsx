import type { SystemDeviceInventoryItem } from "@truckmoov/api/auth";
import { useSuspendSystemDevice } from "@truckmoov/api/auth";
import { Loader2 } from "lucide-react";
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
import { deviceActionError } from "./deviceActionError";

type SuspendDeviceDialogProps = {
  device: SystemDeviceInventoryItem | null;
  onClose: () => void;
};

export function SuspendDeviceDialog({
  device,
  onClose,
}: SuspendDeviceDialogProps) {
  const [
    reason,
    setReason,
  ] = useState("");
  const mutation = useSuspendSystemDevice();

  const close = () => {
    setReason("");
    onClose();
  };

  const submit = () => {
    if (!device)
      return;
    mutation.mutate(
      {
        id: device.id,
        ...(reason.trim() ? { data: { reason: reason.trim() } } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Device suspended");
          close();
        },
        onError: deviceActionError,
      },
    );
  };

  return (
    <Dialog
      open={!!device}
      onOpenChange={open => !open && !mutation.isPending && close()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend Device</DialogTitle>
          <DialogDescription>
            {`This takes ${device?.manufacturer} ${device?.model} (IMEI ${device?.imei}) out of service platform-wide and releases its vehicle assignment. Add an optional reason for the audit log.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="suspend-reason">Reason (optional)</Label>
          <Textarea
            id="suspend-reason"
            rows={3}
            placeholder="Reason for suspension…"
            className="resize-none"
            value={reason}
            onChange={event => setReason(event.target.value)}
            disabled={mutation.isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={close}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={submit}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suspend Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
