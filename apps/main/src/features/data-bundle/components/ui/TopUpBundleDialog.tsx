import type { SimItem } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getAllDataBundleRatesQueryOptions,
  getDataBundleCarriersQueryOptions,
  getDataBundleDashboardSummaryQueryOptions,
  getSimsQueryOptions,
  useAllocateDataBundle,
} from "@truckmoov/api/auth";
import {
  CreditCard, Search, Smartphone, Wallet, Zap,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import {
  Link, useNavigate,
} from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  formatBundleSize, formatMobile, formatNgn, isSimBlocked, useDebouncedValue,
} from "@/features/data-bundle/utils/dataBundle";
import { InstallationPendingNote } from "@/features/get-started/components/ui/InstallationGate";
import { useInstallationPending } from "@/features/get-started/hooks/useInstallationPending";
import { cn } from "@/lib/utils";

type TopUpBundleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselect a SIM by mobile number (row "Top up" / Allocation Details). */
  initialMobileNumber?: string;
};

const WALLET_HREF = "/wallet";

function digits(value: string) {
  return value.replace(
    /\D/g,
    "",
  ).slice(-10);
}
const sameCarrier = (a: string | undefined, b: string) => (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The design's "Top Up Bundle": pick a SIM, then a plan for that SIM's carrier, and
 * credit it via POST /auth/data-bundles/allocations. SIMs are searched on GET /auth/sims;
 * plans are every rate of the SIM's carrier from GET /auth/data-bundles/rates.
 */
export function TopUpBundleDialog({
  open, onOpenChange, initialMobileNumber,
}: TopUpBundleDialogProps) {
  const navigate = useNavigate();
  const [
    simSearch,
    setSimSearch,
  ] = useState("");
  const [
    planSearch,
    setPlanSearch,
  ] = useState("");
  const debouncedSimSearch = useDebouncedValue(simSearch.trim());
  const simsQuery = useQuery({
    ...getSimsQueryOptions({
      params: {
        search: debouncedSimSearch || undefined, limit: 50,
      },
    }),
    enabled: open,
  });
  const carriersQuery = useQuery({
    ...getDataBundleCarriersQueryOptions(),
    enabled: open,
  });
  const summaryQuery = useQuery({
    ...getDataBundleDashboardSummaryQueryOptions(),
    enabled: open,
  });
  const allocate = useAllocateDataBundle();
  const installationPending = useInstallationPending();
  const purchaseRef = useRef({
    selection: "", key: "",
  });
  const [
    sim,
    setSim,
  ] = useState<SimItem | null>(null);
  const [
    bundleId,
    setBundleId,
  ] = useState("");

  const sims = simsQuery.data?.data?.items ?? [];

  useEffect(
    () => {
      if (!open)
        return;
      purchaseRef.current = {
        selection: "", key: "",
      };
      setSim(null);
      setSimSearch(initialMobileNumber ? digits(initialMobileNumber) : "");
      setPlanSearch("");
      setBundleId("");
    },
    [
      open,
      initialMobileNumber,
    ],
  );

  // Preselect the requested SIM once the search for its number returns it.
  useEffect(
    () => {
      if (!open || sim || !initialMobileNumber)
        return;
      const match = sims.find(s => digits(s.mobileNumber) === digits(initialMobileNumber));
      if (match && !isSimBlocked(match.status))
        setSim(match);
    },
    [
      open,
      sim,
      sims,
      initialMobileNumber,
    ],
  );

  const carrier = sim ? (carriersQuery.data?.data?.carriers ?? []).find(c => sameCarrier(
    c.name,
    sim.operator,
  ) || sameCarrier(
    c.displayName,
    sim.operator,
  )) : undefined;
  const plansQuery = useQuery({
    ...getAllDataBundleRatesQueryOptions({ carriers: carrier ? [carrier.id] : [] }),
    enabled: open && Boolean(carrier),
  });
  const planQuery = planSearch.trim().toLowerCase();
  const plans = (plansQuery.data ?? []).filter(b => b.active && (!planQuery || b.name.toLowerCase().includes(planQuery) || b.code.toLowerCase().includes(planQuery)));
  const plan = (plansQuery.data ?? []).find(b => b.id === bundleId);
  const balance = summaryQuery.data?.data.walletBalance;
  const short = plan && balance !== undefined && plan.price > balance;

  const submit = () => {
    if (installationPending || !plan || !sim || !carrier || allocate.isPending)
      return;
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
          planType: plan.billingCycle,
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
          toast.success(`${plan.name} credited to ${formatMobile(sim.mobileNumber)}`);
          onOpenChange(false);
        },
        onError: (error) => {
          // The server answered, so nothing stays charged under this key: a retry needs a fresh one.
          // A lost response (no status) keeps the key so a retry cannot charge twice.
          if ((error as { statusCode?: number }).statusCode) {
            purchaseRef.current = {
              selection: "", key: "",
            };
          }
          if (error.message.startsWith("Wallet balance")) {
            toast.error(
              error.message,
              {
                action: {
                  label: "Fund wallet", onClick: () => navigate(WALLET_HREF),
                },
              },
            );
            return;
          }
          toast.error(error.message);
        },
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

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Wallet balance
            <span className="font-semibold">{balance === undefined ? "-" : formatNgn(balance)}</span>
          </span>
          <Link
            to={WALLET_HREF}
            className="text-xs font-medium text-primary hover:underline"
          >
            Fund wallet
          </Link>
        </div>

        <div className="space-y-5 py-2">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                className="text-sm font-medium"
                required
              >
                SIM Card
              </Label>
              <p className="text-xs text-muted-foreground">
                Pick the SIM you want to top up. Each one shows its carrier and the device it's fitted to.
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search mobile number or ICCID..."
                  aria-label="Search SIM cards"
                  value={simSearch}
                  onChange={e => setSimSearch(e.target.value)}
                />
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {sims.map((s) => {
                  const selected = sim?.id === s.id;
                  const blocked = isSimBlocked(s.status);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={allocate.isPending || blocked}
                      aria-pressed={selected}
                      title={blocked ? `This SIM is ${s.status} and cannot be topped up` : undefined}
                      onClick={() => {
                        setSim(s);
                        setBundleId("");
                        setPlanSearch("");
                      }}
                      className={cn(
                        cardClass(selected),
                        blocked && "cursor-not-allowed opacity-50 hover:border-border/70 hover:bg-transparent",
                      )}
                    >
                      <span className={iconClass(selected)}>
                        <Smartphone className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{formatMobile(s.mobileNumber)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {blocked
                            ? `SIM ${s.status.toLowerCase()}: cannot be topped up`
                            : s.assignedDevice
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
              <Label
                className="text-sm font-medium"
                required
              >
                Data Plan
              </Label>
              <p className="text-xs text-muted-foreground">
                {sim
                  ? "Pick the bundle to credit to this SIM. Size, validity and price are shown."
                  : "Pick a SIM card first."}
              </p>
              {sim && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search plans..."
                    aria-label="Search data plans"
                    value={planSearch}
                    onChange={e => setPlanSearch(e.target.value)}
                  />
                </div>
              )}
              <div className={cn(
                "max-h-64 space-y-2 overflow-y-auto pr-1",
                !sim && "pointer-events-none opacity-50",
              )}
              >
                {sim && plans.map((b) => {
                  const selected = bundleId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={allocate.isPending}
                      aria-pressed={selected}
                      onClick={() => setBundleId(b.id)}
                      className={cardClass(selected)}
                    >
                      <span className={iconClass(selected)}>
                        <Zap className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{b.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatBundleSize(b.dataAmountGb * 1024)}
                          {" · "}
                          {b.validityDays}
                          {" days validity · "}
                          {b.billingCycle}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold">{formatNgn(b.price)}</span>
                        <Badge
                          variant="outline"
                          className="mt-0.5 text-[10px]"
                        >
                          {carrier?.displayName || carrier?.name}
                        </Badge>
                      </span>
                    </button>
                  );
                })}
                {sim && (plansQuery.isLoading || carriersQuery.isLoading) && <p role="status">Loading bundle plans...</p>}
                {plansQuery.isError && (
                  <p role="alert">
                    {plansQuery.error.message}
                    <Button
                      variant="link"
                      onClick={() => plansQuery.refetch()}
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
                {sim && ((carriersQuery.isSuccess && !carrier) || (plansQuery.isSuccess && plans.length === 0)) && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No bundle plans available
                    {` for ${sim.operator}`}
                    .
                  </p>
                )}
              </div>
            </div>
          </div>

          {plan && sim && (
            <div className="rounded-md border bg-muted/40 p-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMobile(sim.mobileNumber)}
                  {" · "}
                  {formatBundleSize(plan.dataAmountGb * 1024)}
                  {" · "}
                  {plan.validityDays}
                  {" days"}
                </p>
              </div>
              <p className="text-base font-semibold">{formatNgn(plan.price)}</p>
            </div>
          )}
          {short && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {`Your wallet balance (${formatNgn(balance)}) does not cover this plan (${formatNgn(plan.price)}). `}
              <Link
                to={WALLET_HREF}
                className="font-medium underline"
              >
                Fund the wallet
              </Link>
              {" to continue."}
            </p>
          )}
        </div>

        {installationPending && <InstallationPendingNote />}

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
            disabled={installationPending || !sim || !plan || !carrier || short || allocate.isPending}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {allocate.isPending ? "Processing..." : "Top Up Bundle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
