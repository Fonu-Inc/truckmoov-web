import type { SystemTenant, SystemTenantQuotas } from "@truckmoov/api/auth";
import { useUpdateSystemTenantQuotas } from "@truckmoov/api/auth";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

type QuotaKey = keyof SystemTenantQuotas;

const FIELDS: Array<{ key: QuotaKey; label: string; usage: (tenant: SystemTenant) => number }> = [
  { key: "vehicles", label: "Max vehicles", usage: tenant => tenant.vehicleCount },
  { key: "drivers", label: "Max drivers", usage: tenant => tenant.driverCount },
  { key: "devices", label: "Max devices", usage: tenant => tenant.deviceCount },
  { key: "sims", label: "Max SIMs", usage: tenant => tenant.simCount },
];

const MIN_REASON = 5;
const MAX_REASON = 500;

type Drafts = Record<QuotaKey, string>;

function toDrafts(overrides: SystemTenantQuotas): Drafts {
  return {
    vehicles: overrides.vehicles?.toString() ?? "",
    drivers: overrides.drivers?.toString() ?? "",
    devices: overrides.devices?.toString() ?? "",
    sims: overrides.sims?.toString() ?? "",
  };
}

function parseDraft(draft: string): number | null | "invalid" {
  const text = draft.trim();
  if (text === "")
    return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= 0 ? value : "invalid";
}

function changedLimits(tenant: SystemTenant, drafts: Drafts) {
  const changes: Partial<SystemTenantQuotas> = {};
  for (const { key } of FIELDS) {
    const next = parseDraft(drafts[key]);
    if (next !== "invalid" && next !== tenant.quotaOverrides[key])
      changes[key] = next;
  }
  return changes;
}

function planLimitText(limit: number | null, planAssigned: boolean) {
  if (limit !== null)
    return `Plan limit ${limit}`;
  return planAssigned ? "Plan limit: unlimited" : "No plan assigned";
}

export function TenantQuotaEditor({ tenant }: { tenant: SystemTenant }) {
  const mutation = useUpdateSystemTenantQuotas();
  const [drafts, setDrafts] = useState<Drafts>(() => toDrafts(tenant.quotaOverrides));
  const [reason, setReason] = useState("");

  const invalid = FIELDS.some(({ key }) => parseDraft(drafts[key]) === "invalid");
  const changes = changedLimits(tenant, drafts);
  const reasonOk = reason.trim().length >= MIN_REASON && reason.trim().length <= MAX_REASON;
  const canSave = !invalid && reasonOk && Object.keys(changes).length > 0 && !mutation.isPending;

  const save = async () => {
    try {
      const result = await mutation.mutateAsync({ id: tenant.id, data: { ...changes, reason: reason.trim() } });
      setDrafts(toDrafts(result.data.quotaOverrides));
      setReason("");
      toast.success("Limits saved");
    }
    catch (error) {
      toast.error((error as { message?: string })?.message ?? "Limits could not be saved");
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Adjust limits</p>
        <p className="text-xs text-muted-foreground">
          A number here replaces the plan limit for this tenant only. Leave it empty to use the plan limit.
          Fleet and SIM registration enforce it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, usage }) => {
          const used = usage(tenant);
          const parsed = parseDraft(drafts[key]);
          const belowUsage = typeof parsed === "number" && parsed < used;
          return (
            <div
              key={key}
              className="space-y-1"
            >
              <Label
                htmlFor={`quota-${key}`}
                className="text-xs text-muted-foreground"
              >
                {label}
              </Label>
              <Input
                id={`quota-${key}`}
                type="number"
                min={0}
                step={1}
                value={drafts[key]}
                placeholder={tenant.planQuotas[key]?.toString() ?? "Unlimited"}
                onChange={event => setDrafts(prev => ({ ...prev, [key]: event.target.value }))}
                className="h-9"
                aria-invalid={parsed === "invalid"}
              />
              <p className="text-[11px] text-muted-foreground">
                {planLimitText(tenant.planQuotas[key], tenant.planAssigned)}
                {` · ${used} in use`}
              </p>
              {parsed === "invalid" && (
                <p className="text-[11px] text-destructive">Use a whole number from 0, or leave empty.</p>
              )}
              {belowUsage && (
                <p className="text-[11px] text-warning">
                  Below the
                  {" "}
                  {used}
                  {" "}
                  already in use. Existing records stay, new ones are refused.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="space-y-1">
        <Label
          htmlFor="quota-reason"
          className="text-xs text-muted-foreground"
        >
          Reason (recorded in the audit log)
        </Label>
        <Input
          id="quota-reason"
          value={reason}
          maxLength={MAX_REASON}
          onChange={event => setReason(event.target.value)}
          placeholder="Why these limits are changing"
          className="h-9"
        />
        <p className="text-[11px] text-muted-foreground">{`${MIN_REASON} to ${MAX_REASON} characters.`}</p>
      </div>
      <Button
        size="sm"
        onClick={save}
        disabled={!canSave}
        className="gap-2"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save limits
      </Button>
    </Card>
  );
}
