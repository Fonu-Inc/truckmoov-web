import type {
  BillingCycle, DataUnit,
} from "@/lib/simBundleUtils";
import {
  AlertTriangle, Loader2, Wifi,
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
import { Textarea } from "@/components/shadcn/textarea";

type BundleCatalogItem = any;
const bundleCatalogData: BundleCatalogItem[] = [];
const useBundleCatalog = () => ({ data: bundleCatalogData });

/**
 * Minimal SIM Request dialog used in the Get Started / Activate System flow
 * and the IoT SIMs page "Request SIM" action.
 *
 * Per spec, collects:
 *   1. Number of SIMs
 *   2. Carrier (MTN / AIRTEL / GLO / FONO)
 *   3. Plan Type (Monthly / Yearly)
 *   4. Data Bundle per SIM (dynamic per carrier + plan type)
 *   5. Use Case
 *   6. Device Mapping (optional toggle)
 *   7. Additional Notes (optional)
 *
 * ICCID is intentionally NOT collected — it is assigned post-allocation.
 */

export type MinimalSIMRequestData = {
  numberOfSims: number;
  dataLimitGb: number;
  dataAmount: number;
  dataUnit: DataUnit;
  planCycle: BillingCycle;
  carrier: string;
  useCase: string;
  notes?: string;
  deviceMappingEnabled?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MinimalSIMRequestData) => Promise<unknown>;
  /** Remaining SIM quota allowed under the current plan. Omit to disable enforcement. */
  quotaRemaining?: number;
  /** Plan label shown in the warning message. */
  quotaLabel?: string;
};

const carriers = [
  {
    value: "MTN", label: "MTN",
  },
  {
    value: "AIRTEL", label: "AIRTEL",
  },
  {
    value: "GLO", label: "GLO",
  },
  {
    value: "FONO", label: "FONO",
  },
];

export function SIMRequestFormDialogMinimal({
  open, onOpenChange, onSubmit, quotaRemaining, quotaLabel,
}: Props) {
  const [
    numberOfSims,
    setNumberOfSims,
  ] = useState<number>(1);
  const [
    planCycle,
    setPlanCycle,
  ] = useState<BillingCycle>("monthly");
  const [
    carrier,
    setCarrier,
  ] = useState<string>("MTN");
  const [
    bundleCode,
    setBundleCode,
  ] = useState<string>("");
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
    deviceMappingEnabled,
    setDeviceMappingEnabled,
  ] = useState(false);

  const { data: bundleCatalog = [] } = useBundleCatalog();
  const availableBundles = bundleCatalog.filter(
    b => b.is_active && b.carrier?.toUpperCase() === carrier?.toUpperCase() && b.billing_cycle === planCycle,
  );
  const selectedBundle = availableBundles.find(b => b.code === bundleCode);

  const reset = () => {
    setNumberOfSims(1);
    setPlanCycle("monthly");
    setCarrier("MTN");
    setBundleCode("");
    setUseCase("");
    setNotes("");
    setDeviceMappingEnabled(false);
  };

  const overQuota = typeof quotaRemaining === "number" && numberOfSims > quotaRemaining;
  const isValid = numberOfSims >= 1 && !!carrier && !!bundleCode && !!useCase.trim() && !overQuota;

  const handleSubmit = async () => {
    if (!isValid || !selectedBundle)
      return;
    setSubmitting(true);
    const dataMb = selectedBundle.data_mb;
    const useGb = dataMb >= 1024;
    const result = await onSubmit({
      numberOfSims,
      dataLimitGb: dataMb / 1024,
      dataAmount: useGb ? dataMb / 1024 : dataMb,
      dataUnit: (useGb ? "GB" : "MB") as DataUnit,
      planCycle,
      carrier,
      useCase: useCase.trim(),
      notes: notes.trim() || undefined,
      deviceMappingEnabled,
    });
    setSubmitting(false);
    if (result) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Request IoT SIMs</DialogTitle>
              <DialogDescription>
                Tell us what you need. Our team will provision and ship the SIMs.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label required>Number of SIMs</Label>
            <Input
              type="number"
              min={1}
              value={numberOfSims}
              onChange={e => setNumberOfSims(Math.max(
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
                        more SIM
                        {quotaRemaining === 1 ? "" : "s"}
                        .
                      </span>
                    )
                  : (
                      <>
                        You can request up to
                        {quotaRemaining}
                        {" "}
                        more SIM
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

          <div className="space-y-1.5">
            <Label required>Carrier</Label>
            <Select
              value={carrier}
              onValueChange={(v) => {
                setCarrier(v);
                setBundleCode("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map(c => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                  >
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label required>Plan Type</Label>
            <Select
              value={planCycle}
              onValueChange={(v) => {
                setPlanCycle(v as BillingCycle);
                setBundleCode("");
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label required>Data Bundle Plan</Label>
            <Select
              value={bundleCode}
              onValueChange={setBundleCode}
              disabled={!carrier || availableBundles.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !carrier
                      ? "Select carrier first"
                      : availableBundles.length === 0
                        ? "No bundles available"
                        : "Select bundle"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableBundles.map(b => (
                  <SelectItem
                    key={b.id}
                    value={b.code}
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Bundles are configured by Platform Admin per carrier and plan type.</p>
          </div>

          <div className="space-y-1.5">
            <Label required>Use Case</Label>
            <Textarea
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              placeholder="Describe how you intend to use these SIMs"
              rows={3}
            />
          </div>

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

        <div className="flex justify-end gap-3 pt-4">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
