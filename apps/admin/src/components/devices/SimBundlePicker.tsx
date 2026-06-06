import { useMemo } from "react";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Smartphone, Database } from "lucide-react";
type BundleCatalogEntry = {
  id: string;
  code: string;
  name: string;
  carrier?: string;
  data_mb: number;
  billing_cycle: string;
  is_active: boolean;
};

export type DataUnit = "KB" | "MB" | "GB";
export type BillingCycle = "monthly" | "yearly";

export interface SimBundleValue {
  amount: number;
  unit: DataUnit;
  cycle: BillingCycle;
}

interface Props {
  value: SimBundleValue;
  onChange: (next: SimBundleValue) => void;
  carrier: string;
  onCarrierChange: (v: string) => void;
  iccid: string;
  onIccidChange: (v: string) => void;
}

export function formatSimBundle(v: SimBundleValue): string {
  return `${v.amount}${v.unit} / ${v.cycle}`;
}

export function SimBundlePicker({
  value,
  onChange,
  carrier,
  onCarrierChange,
  iccid,
  onIccidChange,
}: Props) {
  const catalog: BundleCatalogEntry[] = [];
  const availableBundles = useMemo(
    () =>
      catalog.filter(
        (b) =>
          b.is_active &&
          (!carrier || b.carrier?.toLowerCase() === carrier.toLowerCase()) &&
          b.billing_cycle === value.cycle,
      ),
    [catalog, carrier, value.cycle],
  );
  const currentMb =
    value.unit === "GB" ? value.amount * 1024 : value.unit === "KB" ? value.amount / 1024 : value.amount;
  const selectedCode =
    availableBundles.find((b) => b.data_mb === currentMb)?.code ?? "";

  return (
    <div className="space-y-4 rounded-md border border-border/60 bg-muted/20 p-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">SIM Carrier</Label>
          <Select value={carrier} onValueChange={onCarrierChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MTN">MTN</SelectItem>
              <SelectItem value="Airtel">Airtel</SelectItem>
              <SelectItem value="Glo">Glo</SelectItem>
              <SelectItem value="Fonu">Fonu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Plan Type</Label>
          <Select
            value={value.cycle}
            onValueChange={(c) => onChange({ ...value, cycle: c as BillingCycle })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Data Bundle Plan</Label>
          <Select
            value={selectedCode}
            onValueChange={(code) => {
              const b = availableBundles.find((x) => x.code === code);
              if (!b) return;
              const isGB = b.data_mb >= 1024 && b.data_mb % 1024 === 0;
              onChange({
                ...value,
                amount: isGB ? b.data_mb / 1024 : b.data_mb,
                unit: isGB ? "GB" : "MB",
                cycle: b.billing_cycle as BillingCycle,
              });
            }}
            disabled={!carrier || availableBundles.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !carrier
                    ? "Select a carrier first"
                    : availableBundles.length === 0
                    ? "No bundles available"
                    : "Select a bundle"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableBundles.map((b) => (
                <SelectItem key={b.id} value={b.code}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-[10px] italic text-muted-foreground/60">
            Plans are sourced from the Data Bundles catalog.
          </p>
        </div>
      </div>
    </div>
  );
}



