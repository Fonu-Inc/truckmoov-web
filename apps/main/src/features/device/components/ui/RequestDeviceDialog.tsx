import type { DeviceTrackerType } from "@truckmoov/api/fleet";
import { DeviceStockModelSelects } from "@truckmoov/reusables/components/devices-stock-model-selects";
import type { StockModel } from "@truckmoov/api/auth/device-stock";
import { useQuery } from "@tanstack/react-query";
import { getPickupLocationsQueryOptions } from "@truckmoov/api/auth";
import {
  ArrowLeft, Loader2, MapPin, Send,
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
import { cn } from "@/lib/utils";

export type RequestDevicePayload = {
  quantity: number;
  useCase: string;
  notes?: string;
  /** Devices are collected from a pickup point for every customer type. */
  pickupLocationId: string;
  state?: string;
  city?: string;
  preferredDate?: string;
  preferredTime?: string;
  /** Retained so the dispatcher's full request dialog can reuse this payload. */
  manufacturer?: string;
  model?: string;
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
  pickupLocationId: "",
};

/**
 * "Request Device" in two steps: what is needed, then the pickup point it is
 * collected from (pickup only, for every customer type). The tenant chooses the exact device model.
 */
export function RequestDeviceDialog({
  open, onOpenChange, onSubmit,
}: RequestDeviceDialogProps) {
  const [stockModel,setStockModel]=useState<StockModel|null>(null);
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
        setStockModel(null);
      }
    },
    [open],
  );

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm(f => ({
    ...f, [key]: value,
  }));
  const quantity = Number(form.quantity);
  const detailsValid = Number.isInteger(quantity) && quantity > 0 && form.useCase.trim().length > 0 && !!stockModel;

  const locationsQuery = useQuery({
    ...getPickupLocationsQueryOptions(),
    enabled: open,
  });
  const locations = locationsQuery.data?.data ?? [];
  const states = [...new Set(locations.map(location => location.state))];
  const shown = form.state ? locations.filter(location => location.state === form.state) : locations;
  const pickup = locations.find(location => location.id === form.pickupLocationId);

  const submit = async () => {
    if (!detailsValid || !pickup || !stockModel)
      return;
    setIsSubmitting(true);
    const result = await onSubmit({
      quantity,
      manufacturer:stockModel.manufacturer,
      model:stockModel.model,
      useCase: form.useCase.trim(),
      notes: form.notes.trim() || undefined,
      pickupLocationId: pickup.id,
      state: pickup.state,
      city: pickup.area,
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
              : "Select where you will collect your requested devices. Your request will be sent for approval after you submit."}
          </DialogDescription>
        </DialogHeader>

        {step === "details"
          ? (
              <div className="space-y-4">
                <DeviceStockModelSelects value={stockModel?.id} onChange={setStockModel}/>
                <div className="space-y-2">
                  <Label
                    htmlFor="req-qty"
                    required
                  >
                    Number of Devices Requested
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
                  <Label
                    htmlFor="req-use"
                    required
                  >
                    Use Case
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
                <DeviceStockModelSelects value={stockModel?.id} onChange={setStockModel}/>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={form.state}
                    onValueChange={value => set(
                      "state",
                      value,
                    )}
                    disabled={states.length === 0}
                  >
                    <SelectTrigger><SelectValue placeholder="All states" /></SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
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
                  <Label required>
                    MTN Connect Store / Service Centre
                  </Label>
                  {locationsQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  {locationsQuery.isError && (
                    <p className="text-sm text-destructive">
                      Pickup points couldn't be loaded.
                      {" "}
                      <button
                        type="button"
                        className="font-medium underline"
                        onClick={() => void locationsQuery.refetch()}
                      >
                        Try again
                      </button>
                    </p>
                  )}
                  {locationsQuery.isSuccess && shown.length === 0 && (
                    <p className="text-sm text-muted-foreground">No pickup points are available yet.</p>
                  )}
                  <div
                    role="radiogroup"
                    aria-label="Pickup point"
                    className="max-h-64 space-y-2 overflow-y-auto"
                  >
                    {shown.map(location => (
                      <button
                        key={location.id}
                        type="button"
                        role="radio"
                        aria-checked={form.pickupLocationId === location.id}
                        onClick={() => set(
                          "pickupLocationId",
                          location.id,
                        )}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                          form.pickupLocationId === location.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border/70 hover:border-primary/40",
                        )}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>
                          <span className="block text-sm font-semibold">{location.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {[
                              location.address,
                              location.area,
                              location.state,
                            ].filter(Boolean).join(", ")}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
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
                  disabled={isSubmitting || !pickup}
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
