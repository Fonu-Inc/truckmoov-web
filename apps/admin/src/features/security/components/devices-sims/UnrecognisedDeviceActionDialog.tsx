import type {
  UnrecognisedDevice, UnrecognisedDeviceAction,
} from "@truckmoov/api/auth";
import { useActOnUnrecognisedDevice } from "@truckmoov/api/auth";
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

export type PendingUnrecognisedAction = {
  device: UnrecognisedDevice;
  action: UnrecognisedDeviceAction;
};

const COPY: Record<UnrecognisedDeviceAction, {
  title: string; body: string; done: string;
}> = {
  dismiss: {
    title: "Dismiss this device",
    body: "You are marking this sender as reviewed. Its messages are still held back and it is cleared from the list after 30 days.",
    done: "Device dismissed",
  },
  block: {
    title: "Block this device",
    body: "This sender will be refused from now on. Its messages will no longer be counted or listed.",
    done: "Device blocked",
  },
  unblock: {
    title: "Unblock this device",
    body: "This sender will no longer be refused. It goes back to the open list and its messages are held back until it is registered.",
    done: "Device unblocked",
  },
};

const SUBMIT_LABEL: Record<UnrecognisedDeviceAction, string> = {
  dismiss: "Dismiss device",
  block: "Block device",
  unblock: "Unblock device",
};

const MIN_REASON = 3;

type Props = {
  pending: PendingUnrecognisedAction | null;
  onClose: () => void;
};

export function UnrecognisedDeviceActionDialog({
  pending, onClose,
}: Props) {
  const [
    reason,
    setReason,
  ] = useState("");
  const mutation = useActOnUnrecognisedDevice();
  const copy = pending ? COPY[pending.action] : COPY.dismiss;

  const close = () => {
    setReason("");
    onClose();
  };

  const submit = () => {
    if (!pending)
      return;
    mutation.mutate(
      {
        imei: pending.device.imei, action: pending.action, data: { reason: reason.trim() },
      },
      {
        onSuccess: () => {
          toast.success(copy.done);
          close();
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={!!pending}
      onOpenChange={open => !open && !mutation.isPending && close()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{`Device ${pending?.device.imei ?? ""}. ${copy.body}`}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="unrecognised-reason">Reason</Label>
          <Textarea
            id="unrecognised-reason"
            rows={3}
            placeholder="Why are you doing this?"
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
            variant={pending?.action === "block" ? "destructive" : "default"}
            disabled={mutation.isPending || reason.trim().length < MIN_REASON}
            onClick={submit}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {SUBMIT_LABEL[pending?.action ?? "dismiss"]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
