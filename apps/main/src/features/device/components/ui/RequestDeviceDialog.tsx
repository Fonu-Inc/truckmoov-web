import type { DeviceTrackerType } from "@truckmoov/api/fleet";
import {
  useDeviceCatalogManufacturers, useDeviceSetupRequestTrackerTypes,
} from "@truckmoov/api/fleet";
import {
  Loader2, Send,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

export type RequestDevicePayload = {
  quantity: number;
  manufacturer: string;
  trackerType: DeviceTrackerType;
  useCase: string;
  notes?: string;
};

type RequestDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves to null on failure so the dialog stays open. */
  onSubmit: (data: RequestDevicePayload) => Promise<unknown>;
  manufacturers: string[];
};

const EMPTY = {
  quantity: "1",
  manufacturer: "",
  trackerType: "" as DeviceTrackerType | "",
  useCase: "",
  notes: "",
};

function Required() {
  return <span className="text-destructive"> *</span>;
}

/**
 * "Request Device": quantity, use case and notes. Pickup/delivery fulfilment is out of scope
 * by product decision — fulfilment points belong to dispatch jobs.
 * ponytail: Manufacturer and Tracker Type stay required until the optional-fields change
 * (services-ts b230a04) is on dev; drop the two selects then.
 */
export function RequestDeviceDialog({
  open, onOpenChange, onSubmit, manufacturers,
}: RequestDeviceDialogProps) {
  const [
    form,
    setForm,
  ] = useState(EMPTY);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);
  const catalogQuery = useDeviceCatalogManufacturers();
  const trackerTypesQuery = useDeviceSetupRequestTrackerTypes();

  useEffect(
    () => {
      if (open)
        setForm(EMPTY);
    },
    [open],
  );

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm(f => ({
    ...f, [key]: value,
  }));
  const manufacturerOptions = [
    ...new Set([
      ...(catalogQuery.data?.data?.manufacturers ?? []),
      ...manufacturers,
    ]),
  ];
  const trackerTypes = trackerTypesQuery.data?.data?.trackerTypes ?? [];
  const quantity = Number(form.quantity);
  const valid = Number.isInteger(quantity) && quantity > 0 && form.manufacturer && form.trackerType && form.useCase.trim();

  const submit = async () => {
    if (!valid || !form.trackerType)
      return;
    setIsSubmitting(true);
    const result = await onSubmit({
      quantity,
      manufacturer: form.manufacturer,
      trackerType: form.trackerType,
      useCase: form.useCase.trim(),
      notes: form.notes.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result)
      onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Device</DialogTitle>
          <DialogDescription>
            Tell us how many devices you need and how you will use them. Your request will be sent for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="req-qty">
              Number of Devices Requested
              <Required />
            </Label>
            <Input
              id="req-qty"
              type="number"
              min={1}
              value={form.quantity}
              onChange={e => set(
                "quantity",
                e.target.value,
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Manufacturer
                <Required />
              </Label>
              <Select
                value={form.manufacturer}
                onValueChange={value => set(
                  "manufacturer",
                  value,
                )}
              >
                <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
                <SelectContent>
                  {manufacturerOptions.map(m => (
                    <SelectItem
                      key={m}
                      value={m}
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Tracker Type
                <Required />
              </Label>
              <Select
                value={form.trackerType}
                onValueChange={value => set(
                  "trackerType",
                  value as DeviceTrackerType,
                )}
              >
                <SelectTrigger><SelectValue placeholder="Select tracker type" /></SelectTrigger>
                <SelectContent>
                  {trackerTypes.map(t => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-use">
              Use Case
              <Required />
            </Label>
            <Textarea
              id="req-use"
              placeholder="Explain how these devices will be used across your fleet."
              value={form.useCase}
              onChange={e => set(
                "useCase",
                e.target.value,
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-notes">Notes (Optional)</Label>
            <Textarea
              id="req-notes"
              placeholder="Optional"
              value={form.notes}
              onChange={e => set(
                "notes",
                e.target.value,
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            disabled={!valid || isSubmitting}
            onClick={() => void submit()}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
