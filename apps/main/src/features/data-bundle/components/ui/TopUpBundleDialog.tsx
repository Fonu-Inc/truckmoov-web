import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleCarriersQueryOptions,
  getSimsQueryOptions,
  useAllocateDataBundle,
} from "@truckmoov/api/auth";
import {
  CreditCard, Smartphone, Zap,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatBundleSize, formatMobile, useDataBundleCatalog,
} from "@/features/data-bundle/utils/dataBundle";
import { cn } from "@/lib/utils";

type TopUpBundleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselect a SIM by mobile number (row "Top up" / Allocation Details). */
  initialMobileNumber?: string;
};

function digits(value: string) {
  return value.replace(
    /\D/g,
    "",
  ).slice(-10);
}
const sameCarrier = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The design's "Top Up Bundle": pick a SIM, then a plan for that SIM's carrier, and
 * credit it via POST /auth/data-bundles/allocations. SIMs come from GET /auth/sims —
 * /allocations/sims requires a carrierId up front, which the SIM-first flow doesn't have.
 */
export function TopUpBundleDialog({
  open, onOpenChange, initialMobileNumber,
}: TopUpBundleDialogProps) {
  const { format: fmtCurrency } = useCurrency();
  const {
    catalog, catalogQuery,
  } = useDataBundleCatalog();
  const simsQuery = useQuery({
    ...getSimsQueryOptions({ params: { limit: 200 } }),
    enabled: open,
  });
  const carriersQuery = useQuery({
    ...getDataBundleCarriersQueryOptions(),
    enabled: open,
  });
  const allocate = useAllocateDataBundle();
  const purchaseRef = useRef({
    selection: "", key: "",
  });
  const [
    msisdn,
    setMsisdn,
  ] = useState("");
  const [
    bundleCode,
    setBundleCode,
  ] = useState("");

  const sims = simsQuery.data?.data?.items ?? [];

  useEffect(
    () => {
      if (!open)
        return;
      purchaseRef.current = {
        selection: "", key: "",
      };
      const match = initialMobileNumber
        ? sims.find(s => digits(s.mobileNumber) === digits(initialMobileNumber))
        : undefined;
      setMsisdn(match?.mobileNumber ?? initialMobileNumber ?? "");
      setBundleCode("");
    },
    // Reset only when the dialog opens; SIMs loading later shouldn't clear a pick.
    // eslint-disable-next-line react/exhaustive-deps
    [
      open,
      initialMobileNumber,
    ],
  );

  const sim = sims.find(s => digits(s.mobileNumber) === digits(msisdn));
  const plans = catalog.filter(b => b.is_active && (!sim || sameCarrier(
    b.carrier,
    sim.operator,
  )));
  const plan = plans.find(b => b.code === bundleCode);
  const carrier = (carriersQuery.data?.data?.carriers ?? []).find(c =>
    plan && (sameCarrier(
      c.name,
      plan.carrier,
    ) || sameCarrier(
      c.displayName,
      plan.carrier,
    )));

  const submit = () => {
    if (!plan || !sim || allocate.isPending)
      return;
    if (!carrier) {
      toast.error(`No carrier found for ${plan.carrier}`);
      return;
    }
    const selection = `${sim.id}:${plan.id}`;
    if (purchaseRef.current.selection !== selection) {
      purchaseRef.current = {
        selection, key: crypto.randomUUID(),
      };
    }
    allocate.mutate(
      {
        data: {
          carrierId: carrier.id,
          planType: plan.billing_cycle,
          bundleId: plan.id,
          mobileNumbers: [sim.mobileNumber],
          idempotencyKey: purchaseRef.current.key,
        },
      },
      {
        onSuccess: (res) => {
          if (res.data.failedCount > 0) {
            toast.error(res.data.failures?.[0]?.reason ?? "Top-up failed");
            return;
          }
          toast.success(`${plan.name} credited to ${formatMobile(msisdn)}`);
          onOpenChange(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const cardClass = (selected: boolean) => cn(
    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
    selected ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border/70 hover:border-primary/50 hover:bg-muted/40",
  );
  const iconClass = (selected: boolean) => cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
    selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {" "}
            Top Up Bundle
          </DialogTitle>
          <DialogDescription>
            Choose a SIM card and the plan you want to credit to it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">SIM Card</Label>
              <p className="text-xs text-muted-foreground">
                Pick the SIM you want to top up — each one shows its carrier and the device it's fitted to.
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {sims.map((s) => {
                  const selected = sim?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={allocate.isPending}
                      aria-pressed={selected}
                      onClick={() => {
                        setMsisdn(s.mobileNumber);
                        setBundleCode("");
                      }}
                      className={cardClass(selected)}
                    >
                      <span className={iconClass(selected)}>
                        <Smartphone className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{formatMobile(s.mobileNumber)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.assignedDevice
                            ? `${s.assignedDevice.name || s.assignedDevice.imei} · ${s.assignedDevice.type}`
                            : "Not fitted to a device"}
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[10px]"
                      >
                        {s.operator}
                      </Badge>
                    </button>
                  );
                })}
                {simsQuery.isLoading && <p role="status">Loading SIM cards...</p>}
                {simsQuery.isError && (
                  <p role="alert">
                    {simsQuery.error.message}
                    <Button
                      variant="link"
                      onClick={() => simsQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </p>
                )}
                {simsQuery.isSuccess && sims.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No SIM cards found.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Plan</Label>
              <p className="text-xs text-muted-foreground">
                {sim
                  ? "Pick the bundle to credit to this SIM — size, validity and price are shown."
                  : "Pick a SIM card first."}
              </p>
              <div className={cn(
                "max-h-64 space-y-2 overflow-y-auto pr-1",
                !sim && "pointer-events-none opacity-50",
              )}
              >
                {plans.map((b) => {
                  const selected = bundleCode === b.code;
                  return (
                    <button
                      key={b.code}
                      type="button"
                      disabled={!sim || allocate.isPending}
                      aria-pressed={selected}
                      onClick={() => setBundleCode(b.code)}
                      className={cardClass(selected)}
                    >
                      <span className={iconClass(selected)}>
                        <Zap className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{b.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatBundleSize(b.data_mb)}
                          {" · "}
                          {b.validity_days}
                          {" days validity · "}
                          {b.billing_cycle}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold">{fmtCurrency(Number(b.price_ngn))}</span>
                        <Badge
                          variant="outline"
                          className="mt-0.5 text-[10px]"
                        >
                          {b.carrier}
                        </Badge>
                      </span>
                    </button>
                  );
                })}
                {catalogQuery.isLoading && <p role="status">Loading bundle plans...</p>}
                {catalogQuery.isError && (
                  <p role="alert">
                    {catalogQuery.error.message}
                    <Button
                      variant="link"
                      onClick={() => catalogQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </p>
                )}
                {carriersQuery.isError && (
                  <p role="alert">
                    {carriersQuery.error.message}
                    <Button
                      variant="link"
                      onClick={() => carriersQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </p>
                )}
                {catalogQuery.isSuccess && plans.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No bundle plans available
                    {sim ? ` for ${sim.operator}` : ""}
                    .
                  </p>
                )}
              </div>
            </div>
          </div>

          {plan && msisdn && (
            <div className="rounded-md border bg-muted/40 p-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMobile(msisdn)}
                  {" · "}
                  {formatBundleSize(plan.data_mb)}
                  {" · "}
                  {plan.validity_days}
                  {" days"}
                </p>
              </div>
              <p className="text-base font-semibold">{fmtCurrency(Number(plan.price_ngn))}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={submit}
            disabled={!sim || !plan || !carrier || allocate.isPending}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {allocate.isPending ? "Processing..." : "Top Up Bundle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
