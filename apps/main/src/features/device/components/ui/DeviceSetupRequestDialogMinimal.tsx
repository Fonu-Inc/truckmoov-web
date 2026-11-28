import type { SimBundleValue } from "./SimBundlePicker";
import { useQuery } from "@tanstack/react-query";
import { supportedStockModels } from "@truckmoov/api/auth/device-stock";
import {
  AlertTriangle, Cpu, Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";

/**
 * Minimal Device Request dialog used in the Get Started / Activate System flow.
 *
 * Per spec, this collects ONLY intent — not operational data:
 *   1. Number of Devices
 *   2. Manufacturer
 *   3. Model
 *   4. Use Case
 *   5. Additional Notes (optional)
 *
 * The full dialog (with IMEI, SIM toggle, vehicle, location, scheduling) is
 * still used post-onboarding from the Devices page.
 */

export type MinimalDeviceRequestData = {
  quantity: number;
  manufacturer: string;
  model: string;
  use_case: string;
  notes?: string;
  needs_sim?: boolean;
  sim_iccid?: string;
  sim_carrier?: string;
  sim_bundle?: SimBundleValue;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MinimalDeviceRequestData) => Promise<unknown>;
  /** Remaining device quota allowed under the current plan. Omit to disable enforcement. */
  quotaRemaining?: number;
  /** Plan label shown in the warning message (e.g. "Starter"). */
  quotaLabel?: string;
};

export function DeviceSetupRequestDialogMinimal({
  open, onOpenChange, onSubmit, quotaRemaining, quotaLabel,
}: Props) {
  const { data: catalog = [] } = useQuery({
    queryKey: ["supported-device-stock-models"], queryFn: supportedStockModels, enabled: open,
  });

  const [
    quantity,
    setQuantity,
  ] = useState<number>(1);
  const [
    manufacturer,
    setManufacturer,
  ] = useState("");
  const [
    model,
    setModel,
  ] = useState("");
  const [
    useCase,
    setUseCase,
  ] = useState("");
  const [
    notes,
    setNotes,
  ] = useState("");
  const [
    submitting,
    setSubmitting,
  ] = useState(false);
  const [
    needsSim,
    setNeedsSim,
  ] = useState(false);

  const manufacturers = [...new Set(catalog.map(m => m.manufacturer))].sort();
  const models = catalog.filter(m => m.manufacturer === manufacturer);

  const reset = () => {
    setQuantity(1);
    setManufacturer("");
    setModel("");
    setUseCase("");
    setNotes("");
    setNeedsSim(false);
  };

  const overQuota = typeof quotaRemaining === "number" && quantity > quotaRemaining;
  const isValid = quantity >= 1 && !!manufacturer && !!model.trim() && !!useCase.trim() && !overQuota;

  const handleSubmit = async () => {
    if (!isValid)
      return;
    setSubmitting(true);
    const result = await onSubmit({
      quantity,
      manufacturer,
      model: model.trim(),
      use_case: useCase.trim(),
      notes: notes.trim() || undefined,
      needs_sim: needsSim,
      sim_iccid: undefined,
      // Carrier / bundle are pre-set by the platform when needsSim is true (default: MTN).
      sim_carrier: needsSim ? "MTN" : undefined,
      sim_bundle: undefined,
    });
    setSubmitting(false);
    if (result) {
      onOpenChange(false);
      setTimeout(
        reset,
        0,
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            Request Devices
          </DialogTitle>
          <DialogDescription>
            Tell us what you need. Our team will configure and provision your trackers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quantity */}
          <div className="space-y-1.5">
            <Label required>Number of Devices</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(
                1,
                Number(e.target.value) || 1,
              ))}
            />
            {typeof quotaRemaining === "number" && (
              <p className={`text-xs ${overQuota ? "text-destructive" : "text-muted-foreground"}`}>
                {overQuota
                  ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Exceeds your
                        {" "}
                        {quotaLabel ?? "current"}
                        {" "}
                        plan quota. You can request up to
                        {" "}
                        {quotaRemaining}
                        {" "}
                        more device
                        {quotaRemaining === 1 ? "" : "s"}
                        .
                      </span>
                    )
                  : (
                      <>
                        You can request up to
                        {quotaRemaining}
                        {" "}
                        more device
                        {quotaRemaining === 1 ? "" : "s"}
                        {" "}
                        on your
                        {quotaLabel ?? "current"}
                        {" "}
                        plan.
                      </>
                    )}
              </p>
            )}
          </div>

          {/* Manufacturer */}
          <div className="space-y-1.5">
            <Label required>Manufacturer</Label>
            <Select
              value={manufacturer}
              onValueChange={(v) => {
                setManufacturer(v);
                setModel("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer (e.g. Teltonika, Queclink)" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(m => (
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

          {/* Model — dependent dropdown if catalog has matches, else free text */}
          <div className="space-y-1.5">
            <Label required>Model</Label>
            {models.length > 0
              ? (
                  <Select
                    value={model}
                    onValueChange={setModel}
                    disabled={!manufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(m => (
                        <SelectItem
                          key={m.id}
                          value={m.model}
                        >
                          {m.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              : (
                  <Input
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="Enter model name"
                    disabled={!manufacturer}
                  />
                )}
          </div>

          {/* Use Case */}
          <div className="space-y-1.5">
            <Label required>Use Case</Label>
            <Textarea
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              placeholder="Describe how you intend to use these devices"
              rows={3}
            />
          </div>

          {/* SIM toggle — when on, an MTN SIM bundle is pre-configured by the platform.
              No carrier / plan / bundle selection is exposed here. */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>I need a new SIM card</Label>
              <Switch
                checked={needsSim}
                onCheckedChange={setNeedsSim}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything else our team should know (optional)"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !isValid}
          >
            {submitting
              ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                )
              : (
                  "Submit Request"
                )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
