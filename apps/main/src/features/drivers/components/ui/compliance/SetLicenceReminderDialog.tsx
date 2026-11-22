import type {
  DriverLicenceReminder, DriverLicenceReminderLeadDays, FleetDriver,
} from "@truckmoov/api/fleet";
import {
  useDeleteDriverLicenceReminder, useSetDriverLicenceReminder,
} from "@truckmoov/api/fleet";
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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";

const LEAD_DAYS: DriverLicenceReminderLeadDays[] = [
  7,
  14,
  30,
  60,
  90,
];

/** Set Reminder: mail one address before a driver's licence expires (PUT /fleet/driver-licence-reminders/:driverId). */
export function SetLicenceReminderDialog(props: {
  driver: FleetDriver | null;
  reminder: DriverLicenceReminder | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  // Keyed so the form's initial state is re-read for each driver.
  return (
    <SetLicenceReminderForm
      key={props.driver?.id ?? "none"}
      {...props}
    />
  );
}

function SetLicenceReminderForm({
  driver, reminder, onOpenChange,
}: {
  driver: FleetDriver | null;
  reminder: DriverLicenceReminder | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const setReminder = useSetDriverLicenceReminder();
  const deleteReminder = useDeleteDriverLicenceReminder();
  const [
    recipient,
    setRecipient,
  ] = useState(reminder?.recipientEmail ?? driver?.email ?? "");
  const [
    remindDays,
    setRemindDays,
  ] = useState(String(reminder?.leadDays ?? 30));
  const busy = setReminder.isPending || deleteReminder.isPending;

  const handleSave = () => {
    if (!driver)
      return;
    if (!recipient.trim()) {
      toast.error("Enter a recipient email");
      return;
    }
    setReminder.mutate(
      {
        driverId: driver.id, data: {
          recipientEmail: recipient.trim(), leadDays: Number(remindDays) as DriverLicenceReminderLeadDays,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Reminder set ${remindDays} days before expiry`);
          onOpenChange(false);
        },
        onError: (error: { message: string }) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleRemove = () => {
    if (!driver)
      return;
    deleteReminder.mutate(
      { driverId: driver.id },
      {
        onSuccess: () => {
          toast.success("Reminder removed");
          onOpenChange(false);
        },
        onError: (error: { message: string }) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <Dialog
      open={!!driver}
      onOpenChange={(open) => {
        if (!busy)
          onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          <DialogDescription>
            Get reminded before
            {" "}
            {driver?.name}
            's licence expires.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licence-reminder-email">Recipient Email</Label>
            <Input
              id="licence-reminder-email"
              type="email"
              placeholder="name@company.com"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Remind me before</Label>
            <Select
              value={remindDays}
              onValueChange={setRemindDays}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_DAYS.map(d => (
                  <SelectItem
                    key={d}
                    value={String(d)}
                  >
                    {d}
                    {" "}
                    days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {reminder && (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive sm:mr-auto"
              disabled={busy}
              onClick={handleRemove}
            >
              Remove Reminder
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            loading={setReminder.isPending}
            disabled={busy}
            onClick={handleSave}
          >
            Save Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
