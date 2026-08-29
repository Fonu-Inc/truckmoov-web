import { getSystemSubscriptionPlansQueryOptions } from "@truckmoov/api/auth";
import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  RefreshCw,
  Save,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";

// ponytail: FX card still stubbed — separate endpoint, out of scope for this change.
const rate = 0;
const updatedAt: string | null = null;
const fxLoading = false;
const updateFx = {
  mutateAsync: async (..._args: any[]) => {},
  isPending: false,
};

const ngnFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const usdFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export function FxRateCard() {
  const [fxDraft, setFxDraft] = useState<string>(String(rate));
  useEffect(() => setFxDraft(String(rate)), []);

  const handleSaveFx = async () => {
    const n = Number(fxDraft);
    if (!Number.isFinite(n) || n <= 0)
      return;
    await updateFx.mutateAsync(n);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          USD ↔ NGN Exchange Rate
        </CardTitle>
        <CardDescription>
          Sets the conversion used when plan prices are toggled to USD on the onboarding subscription page.
          Update this whenever the official rate changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label>1 USD =</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                step="0.01"
                value={fxDraft}
                onChange={e => setFxDraft(e.target.value)}
                className="w-40"
                disabled={fxLoading}
              />
              <span className="text-sm text-muted-foreground">NGN</span>
            </div>
          </div>
          <Button
            onClick={handleSaveFx}
            disabled={updateFx.isPending || Number(fxDraft) === rate || !Number(fxDraft)}
          >
            {updateFx.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Update Rate
          </Button>
          {updatedAt && (
            <span className="text-xs text-muted-foreground">
              Last updated
              {" "}
              {formatRelative(updatedAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlanPricingManager() {
  const { data, isLoading } = useQuery(getSystemSubscriptionPlansQueryOptions());
  const plans = data?.data.plans ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Subscription Plan Pricing
        </CardTitle>
        <CardDescription>
          Monthly and yearly NGN pricing for each plan, sourced from
          {" "}
          <code>/auth/system/subscription-plans</code>
          . USD equivalents use the rate configured under Configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
        {!isLoading && plans.length === 0 && (
          <p className="text-sm text-muted-foreground">No subscription plans configured.</p>
        )}
        {plans.map((p) => {
          const yearlyNgn = p.yearlyMonthlyEquivalentNgn !== null
            ? p.yearlyMonthlyEquivalentNgn * 12
            : null;
          const usdMonthly = rate > 0 && p.monthlyPriceNgn !== null ? p.monthlyPriceNgn / rate : null;
          const usdYearly = rate > 0 && yearlyNgn !== null ? yearlyNgn / rate : null;
          return (
            <div
              key={p.code}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{p.name}</span>
                <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                {p.badge && <Badge variant="secondary">{p.badge}</Badge>}
                {p.customPricing && <Badge variant="secondary">Custom pricing</Badge>}
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <PriceCell
                  label="Monthly Price (NGN)"
                  ngn={p.monthlyPriceNgn}
                  usd={usdMonthly}
                  customPricing={p.customPricing}
                />
                <PriceCell
                  label="Yearly Price (NGN)"
                  ngn={yearlyNgn}
                  usd={usdYearly}
                  customPricing={p.customPricing}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PriceCell({
  label,
  ngn,
  usd,
  customPricing,
}: {
  label: string;
  ngn: number | null;
  usd: number | null;
  customPricing: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <p className="text-lg font-semibold">
        {customPricing || ngn === null ? "Contact sales" : `₦${ngnFormatter.format(ngn)}`}
      </p>
      {usd !== null && (
        <p className="text-xs text-muted-foreground">
          ≈ $
          {usdFormatter.format(usd)}
          {" "}
          USD
        </p>
      )}
    </div>
  );
}
