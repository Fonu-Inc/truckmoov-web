import type { TenantLicence } from "@truckmoov/api/billing";
import { useTenantLicence } from "@truckmoov/api/billing";
import {
  addDays, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  BadgeCheck, CalendarClock, Cpu, Package, RefreshCw, Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  formatLongDate, ngn,
} from "@/features/billing/utils/billingHelpers";
import { SectionError } from "@/features/billing/utils/billingShared";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TenantLicence["status"], string> = {
  active: "Active",
  renewed: "Renewed",
  ended: "Ended",
};

function Fact({
  icon: Icon, label, value, hint,
}: {
  icon: typeof Cpu; label: string; value: React.ReactNode; hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium tabular-nums truncate">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function renewalDate(periodEnd: string) {
  const next = addDays(
    periodEnd,
    1,
  );
  return next ? toDateParam(next) : periodEnd;
}

function validityHint(days: number | null) {
  if (!days)
    return undefined;
  return `Valid for ${Math.round(days / 30.4375)} months from purchase`;
}

function PlanBody({ plan }: { plan: TenantLicence }) {
  const price = plan.pricePerDeviceNgn;
  return (
    <div className="surface-sleek text-card-foreground surface-sleek rounded-2xl border-primary/40 bg-primary/5 overflow-hidden">
      <div className="h-1.5 w-full bg-primary" />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              CURRENT M2M LICENSE PLAN
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Package className="h-5 w-5" />
              </span>
              <h3 className="text-2xl font-semibold leading-tight">{plan.planName}</h3>
              <div className={cn(
                "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                plan.status === "active"
                  ? "border-transparent shadow-sm rounded-full bg-primary text-primary-foreground hover:bg-primary"
                  : "text-foreground rounded-full",
              )}
              >
                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                {STATUS_LABEL[plan.status]}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">
              {price === null ? "—" : ngn(price)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">per device</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact
            icon={Cpu}
            label="Devices purchased"
            value={`${plan.deviceCount} devices`}
            hint={plan.devicesInUse === null ? undefined : `${plan.devicesInUse} in use`}
          />
          <Fact
            icon={Wallet}
            label="Total amount paid"
            value={plan.totalPaidNgn === null ? "—" : ngn(plan.totalPaidNgn)}
            hint={price === null ? undefined : `${plan.deviceCount} × ${ngn(price)}`}
          />
          <Fact
            icon={CalendarClock}
            label="Date of purchase"
            value={formatLongDate(plan.periodStart)}
          />
          <Fact
            icon={RefreshCw}
            label="Renewal price"
            value={plan.renewalPricePerDeviceNgn === null ? "—" : `${ngn(plan.renewalPricePerDeviceNgn)} per device`}
          />
          <Fact
            icon={CalendarClock}
            label="Renews on"
            value={formatLongDate(renewalDate(plan.periodEnd))}
            hint={validityHint(plan.validityDays)}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The same card when the account has no licence yet. The design app always shows
 * the plan card, so it stays in place with every value read as "—" (the licence
 * endpoint exists; this account simply has no plan on it).
 */
function NoPlanBody() {
  return (
    <div className="surface-sleek text-card-foreground surface-sleek rounded-2xl border-primary/40 bg-primary/5 overflow-hidden">
      <div className="h-1.5 w-full bg-primary" />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              CURRENT M2M LICENSE PLAN
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Package className="h-5 w-5" />
              </span>
              <h3 className="text-2xl font-semibold leading-tight">—</h3>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">—</p>
            <p className="mt-1 text-xs text-muted-foreground">per device</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact
            icon={Cpu}
            label="Devices purchased"
            value="—"
          />
          <Fact
            icon={Wallet}
            label="Total amount paid"
            value="—"
          />
          <Fact
            icon={CalendarClock}
            label="Date of purchase"
            value="—"
          />
          <Fact
            icon={RefreshCw}
            label="Renewal price"
            value="—"
          />
          <Fact
            icon={CalendarClock}
            label="Renews on"
            value="—"
          />
        </div>
      </div>
    </div>
  );
}

export function CurrentPlanCard() {
  const licence = useTenantLicence();
  if (licence.isLoading)
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  if (licence.isError) {
    return (
      <SectionError
        message="Could not load your current plan."
        onRetry={() => licence.refetch()}
      />
    );
  }
  const plan = licence.data?.data;
  return plan ? <PlanBody plan={plan} /> : <NoPlanBody />;
}
