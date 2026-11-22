import type { DeviceTrackerType } from "@truckmoov/api/fleet";
import { NIGERIAN_STATES } from "@truckmoov/api/auth";
import {
  ArrowLeft, Loader2, Send,
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
  useCase: string;
  notes?: string;
  state?: string;
  city?: string;
  preferredDate?: string;
  preferredTime?: string;
  /** Retained so the dispatcher's full request dialog can reuse this payload. */
  manufacturer?: string;
  trackerType?: DeviceTrackerType;
};

type RequestDeviceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves to null on failure so the dialog stays open. */
  onSubmit: (data: RequestDevicePayload) => Promise<unknown>;
  manufacturers?: string[];
};

const EMPTY = {
  quantity: "1",
  useCase: "",
  notes: "",
  state: "",
  city: "",
  preferredDate: "",
  preferredTime: "",
};

function Required() {
  return <span className="text-destructive"> *</span>;
}

/**
 * "Request Device" in two steps: what is needed, then where it should be
 * fulfilled. Hardware (manufacturer / tracker type) is chosen by the platform,
 * so the request carries only the tenant's intent.
 */
export function RequestDeviceDialog({
  open, onOpenChange, onSubmit,
}: RequestDeviceDialogProps) {
  const [
    step,
    setStep,
  ] = useState<"details" | "fulfilment">("details");
  const [
    form,
    setForm,
  ] = useState(EMPTY);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(
    () => {
      if (open) {
        setStep("details");
        setForm(EMPTY);
      }
    },
    [open],
  );

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm(f => ({
    ...f, [key]: value,
  }));
  const quantity = Number(form.quantity);
  const detailsValid = Number.isInteger(quantity) && quantity > 0 && form.useCase.trim().length > 0;

  const submit = async () => {
    if (!detailsValid)
      return;
    setIsSubmitting(true);
    const result = await onSubmit({
      quantity,
      useCase: form.useCase.trim(),
      notes: form.notes.trim() || undefined,
      state: form.state || undefined,
      city: form.city.trim() || undefined,
      preferredDate: form.preferredDate || undefined,
      preferredTime: form.preferredTime || undefined,
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
            {step === "details"
              ? "Tell us how many devices you need and how you will use them. Next, choose how you will receive them."
              : "Choose when and where the devices should be delivered or installed."}
          </DialogDescription>
        </DialogHeader>

        {step === "details"
          ? (
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
            )
          : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={form.state}
                      onValueChange={value => set(
                        "state",
                        value,
                      )}
                    >
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map(state => (
                          <SelectItem
                            key={state}
                            value={state}
                          >
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-city">City</Label>
                    <Input
                      id="req-city"
                      value={form.city}
                      onChange={e => set(
                        "city",
                        e.target.value,
                      )}
                      placeholder="e.g. Lagos"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="req-date">Preferred Date</Label>
                    <Input
                      id="req-date"
                      type="date"
                      value={form.preferredDate}
                      onChange={e => set(
                        "preferredDate",
                        e.target.value,
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-time">Preferred Time</Label>
                    <Input
                      id="req-time"
                      type="time"
                      value={form.preferredTime}
                      onChange={e => set(
                        "preferredTime",
                        e.target.value,
                      )}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fulfilment details are optional. The platform will confirm the final schedule.
                </p>
              </div>
            )}

        <DialogFooter>
          {step === "fulfilment" && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("details")}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
          {step === "details"
            ? (
                <Button
                  type="button"
                  disabled={!detailsValid}
                  onClick={() => setStep("fulfilment")}
                >
                  Continue to Fulfillment
                </Button>
              )
            : (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submit()}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Request
                </Button>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
