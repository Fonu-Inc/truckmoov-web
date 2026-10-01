import type { DeviceTrackerType } from "@truckmoov/api/fleet";
import { NIGERIAN_STATES } from "@truckmoov/api/auth";
import {
  useDeviceCatalogManufacturers, useDeviceSetupRequestTrackerTypes,
} from "@truckmoov/api/fleet";
import {
  ArrowLeft, Loader2, MapPin, Send, Store, Truck,
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
  manufacturer: string;
  trackerType: DeviceTrackerType;
  useCase: string;
  notes?: string;
  state?: string;
  city?: string;
};

type Fulfilment = "pickup" | "delivery";

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
  fulfilment: "pickup" as Fulfilment,
  state: "",
  area: "",
  store: "",
  street: "",
  city: "",
};

function Required() {
  return <span className="text-destructive"> *</span>;
}

/**
 * The design's two-step "Request Device" flow. Manufacturer and Tracker Type are extra:
 * POST /fleet/device-setup-requests requires them.
 * ponytail: the API has no fulfilment fields (pickup/delivery, store, street) — state and
 * city map to its fields, and the rest is appended to notes. Map properly when it lands.
 */
export function RequestDeviceDialog({
  open, onOpenChange, onSubmit, manufacturers,
}: RequestDeviceDialogProps) {
  const [
    step,
    setStep,
  ] = useState<1 | 2>(1);
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
      if (open) {
        setStep(1);
        setForm(EMPTY);
      }
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
  const step1Valid = Number.isInteger(quantity) && quantity > 0 && form.manufacturer && form.trackerType && form.useCase.trim();
  const step2Valid = form.fulfilment === "pickup"
    ? Boolean(form.state && form.area.trim() && form.store.trim())
    : Boolean(form.street.trim() && form.city.trim() && form.state);

  const submit = async () => {
    if (!step1Valid || !step2Valid || !form.trackerType)
      return;
    const fulfilmentNote = form.fulfilment === "pickup"
      ? `Fulfilment: Pickup at ${form.store.trim()}`
      : `Fulfilment: Delivery to ${form.street.trim()}`;
    setIsSubmitting(true);
    const result = await onSubmit({
      quantity,
      manufacturer: form.manufacturer,
      trackerType: form.trackerType,
      useCase: form.useCase.trim(),
      state: form.state,
      city: form.fulfilment === "pickup" ? form.area.trim() : form.city.trim(),
      notes: [
        form.notes.trim(),
        fulfilmentNote,
      ].filter(Boolean).join("\n"),
    });
    setIsSubmitting(false);
    if (result)
      onOpenChange(false);
  };

  const stateSelect = (
    <Select
      value={form.state}
      onValueChange={value => set(
        "state",
        value,
      )}
    >
      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
      <SelectContent>
        {NIGERIAN_STATES.map(s => (
          <SelectItem
            key={s}
            value={s}
          >
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        {step === 1
          ? (
              <>
                <DialogHeader>
                  <DialogTitle>Request Device</DialogTitle>
                  <DialogDescription>
                    Tell us how many devices you need and how you will use them. Next, choose how you will receive them.
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
                  >
                    Close
                  </Button>
                  <Button
                    disabled={!step1Valid}
                    onClick={() => setStep(2)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Continue to Fulfilment
                  </Button>
                </DialogFooter>
              </>
            )
          : (
              <>
                <DialogHeader>
                  <DialogTitle>Device Fulfilment</DialogTitle>
                  <DialogDescription>
                    Choose pickup or delivery for your requested devices. Your request will be sent for approval after you submit.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Device Fulfilment</p>
                    <p className="text-xs text-muted-foreground">Choose how you would like to receive your requested devices.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      {
                        value: "pickup", title: "Pickup", desc: "Collect from an MTN Connect Store", icon: Store,
                      },
                      {
                        value: "delivery", title: "Delivery", desc: "Delivered to your address", icon: Truck,
                      },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set(
                          "fulfilment",
                          opt.value,
                        )}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                          form.fulfilment === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                        )}
                      >
                        <opt.icon className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                          <span className="block text-sm font-medium">{opt.title}</span>
                          <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {form.fulfilment === "pickup"
                    ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>State</Label>
                            {stateSelect}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="req-area">Area</Label>
                            <Input
                              id="req-area"
                              placeholder={form.state ? "e.g. Ikeja" : "Select a state first"}
                              disabled={!form.state}
                              value={form.area}
                              onChange={e => set(
                                "area",
                                e.target.value,
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="req-store">MTN Connect Store / Service Centre</Label>
                            {/* ponytail: no store directory API yet — free text until one exists. */}
                            <Input
                              id="req-store"
                              placeholder={form.area ? "Store or service centre name" : "Select an area first"}
                              disabled={!form.area.trim()}
                              value={form.store}
                              onChange={e => set(
                                "store",
                                e.target.value,
                              )}
                            />
                          </div>
                        </div>
                      )
                    : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="req-street">Street Address</Label>
                            <Input
                              id="req-street"
                              value={form.street}
                              onChange={e => set(
                                "street",
                                e.target.value,
                              )}
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="req-city">City</Label>
                              <Input
                                id="req-city"
                                value={form.city}
                                onChange={e => set(
                                  "city",
                                  e.target.value,
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>State</Label>
                              {stateSelect}
                            </div>
                          </div>
                          <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Delivery and fulfilment fees apply to delivered devices and vary with your delivery location and the number of devices being delivered. Any applicable fee will be shown to you as an additional charge on your quotation before you make payment, so there are no surprise costs later.
                          </p>
                        </div>
                      )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    disabled={!step2Valid || isSubmitting}
                    onClick={() => void submit()}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit
                  </Button>
                </DialogFooter>
              </>
            )}
      </DialogContent>
    </Dialog>
  );
}
