import {
  getSystemSubscriptionPlansQueryOptions,
  useUpdateSubscriptionPlanPrice,
} from "@truckmoov/api/auth";
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
import { toast } from "sonner";
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
          . Each field saves independently. USD equivalents use the rate configured under Configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
        {!isLoading && plans.length === 0 && (
          <p className="text-sm text-muted-foreground">No subscription plans configured.</p>
        )}
        {plans.map(p => (
          <div key={p.code} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{p.name}</span>
              <Badge variant="outline" className="capitalize">{p.tier}</Badge>
              {p.badge && <Badge variant="secondary">{p.badge}</Badge>}
              {p.customPricing && <Badge variant="secondary">Custom pricing</Badge>}
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <PriceEditor
                label="Monthly Price (NGN)"
                planCode={p.code}
                field="monthlyPriceNgn"
                serverValue={p.monthlyPriceNgn}
                customPricing={p.customPricing}
              />
              <PriceEditor
                label="Yearly Monthly-Equivalent (NGN)"
                helperText="Rate a yearly subscriber pays per month. ×12 shown below."
                planCode={p.code}
                field="yearlyMonthlyEquivalentNgn"
                serverValue={p.yearlyMonthlyEquivalentNgn}
                customPricing={p.customPricing}
                showYearlyTotal
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PriceEditor({
  label,
  helperText,
  planCode,
  field,
  serverValue,
  customPricing,
  showYearlyTotal = false,
}: {
  label: string;
  helperText?: string;
  planCode: string;
  field: "monthlyPriceNgn" | "yearlyMonthlyEquivalentNgn";
  serverValue: number | null;
  customPricing: boolean;
  showYearlyTotal?: boolean;
}) {
  const [draft, setDraft] = useState<string>(serverValue !== null ? String(serverValue) : "");
  useEffect(() => {
    setDraft(serverValue !== null ? String(serverValue) : "");
  }, [serverValue]);

  const mutation = useUpdateSubscriptionPlanPrice();
  const parsed = Number(draft);
  const isValid = draft.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
  const changed = isValid && parsed !== serverValue;

  if (customPricing) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <p className="text-lg font-semibold">Contact sales</p>
      </div>
    );
  }

  const usdRate = rate;
  const usd = usdRate > 0 && isValid ? parsed / usdRate : null;
  const yearlyTotal = showYearlyTotal && isValid ? parsed * 12 : null;

  const handleSave = () => {
    mutation.mutate(
      { id: planCode, data: { [field]: parsed } },
      {
        onSuccess: () => toast.success("Plan price updated"),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">₦</span>
        <Input
          type="number"
          min={0}
          step="1"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          disabled={mutation.isPending}
          className="w-40"
        />
        <Button size="sm" onClick={handleSave} disabled={!changed || mutation.isPending}>
          {mutation.isPending
            ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {yearlyTotal !== null && (
        <p className="text-xs text-muted-foreground">
          ≈ ₦
          {ngnFormatter.format(yearlyTotal)}
          {" "}
          / year
        </p>
      )}
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
