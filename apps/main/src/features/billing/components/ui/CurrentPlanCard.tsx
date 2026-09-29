import {
  BadgeCheck,
  CalendarClock,
  Cpu,
  Package,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  currentPlan, formatLongDate,
} from "@/features/billing/utils/enterpriseBillingData";

function Fact({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Cpu;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {" "}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium tabular-nums truncate">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

/**
 * Prominent banner on the customer billing overview showing the M2M plan the
 * organization is on, priced per device.
 */
export function CurrentPlanCard() {
  const { format } = useCurrency();
  const plan = currentPlan();
  if (!plan)
    return null;

  return (
    <Card className="surface-sleek rounded-2xl border-primary/40 bg-primary/5 overflow-hidden">
      <div className="h-1.5 w-full bg-primary" />
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              CURRENT M2M LICENSE PLAN
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Package className="h-5 w-5" />
              </span>
              <h3 className="text-2xl font-semibold leading-tight">{plan.tier}</h3>
              <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                Active
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">
              {format(plan.pricePerDevice)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">per device</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact
            icon={Cpu}
            label="Devices purchased"
            value={`${plan.deviceCount} devices`}
          />
          <Fact
            icon={Wallet}
            label="Total amount paid"
            value={format(plan.totalPaid)}
            hint={`${plan.deviceCount} × ${format(plan.pricePerDevice)}`}
          />
          <Fact
            icon={CalendarClock}
            label="Date of purchase"
            value={formatLongDate(plan.startDate)}
          />
          <Fact
            icon={RefreshCw}
            label="Renewal price"
            value={`${format(plan.renewalPricePerDevice)} per device`}
          />

          <Fact
            icon={CalendarClock}
            label="Renews on"
            value={formatLongDate(plan.renewalDate)}
            hint="Valid for 12 months from purchase"
          />
        </div>

      </CardContent>
    </Card>
  );
}
