import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingExchangeRateQueryOptions,
  getOnboardingPlansQueryOptions,
  getOnboardingSubscriptionCapsQueryOptions,
  useCreatePaymentIntent,
} from "@truckmoov/api/auth";
import {
  AlertCircle,
  Check,
  Cpu,
  CreditCard,
  Gauge,
  Loader2,
  Smartphone,
  Truck,
  Users,
} from "lucide-react";
import { PaymentGatewayDialog } from "@truckmoov/reusables/components/app/PaymentGatewayDialog";
import { EnterpriseEnquiryDialog } from "@/components/onboarding/EnterpriseEnquiryDialog";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { cn } from "@/lib/utils";
import { OnboardingLayout } from "./OnboardingLayout";

function formatPlanLimit(value: number | null): string {
  return value === null ? "Unlimited" : value.toLocaleString();
}
function formatCurrentCap(value: number | null): string {
  return value === null ? "Not set" : value.toLocaleString();
}

export default function SubscriptionOnboarding() {
  const plansQuery = useQuery(getOnboardingPlansQueryOptions());
  const exchangeRateQuery = useQuery(getOnboardingExchangeRateQueryOptions());
  const capsQuery = useQuery(getOnboardingSubscriptionCapsQueryOptions());

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currencyUsd, setCurrencyUsd] = useState(false);
  const [pickedTier, setPickedTier] = useState<string | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const paymentMutation = useCreatePaymentIntent();

  const plans = plansQuery.data?.data.plans ?? [];
  const picked = plans.find((plan) => plan.tier === pickedTier) ?? null;
  const ngnPerUsd = exchangeRateQuery.data?.data.ngnPerUsd ?? 0;

  const getPrice = (monthlyPrice: number | null, yearlyMonthlyPrice: number | null) => {
    if (monthlyPrice === null) return 0;
    return billing === "yearly" ? (yearlyMonthlyPrice ?? monthlyPrice) * 12 : monthlyPrice;
  };

  const formatPrice = (ngn: number) => {
    if (currencyUsd) {
      const usd = ngn / ngnPerUsd;
      return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `₦${ngn.toLocaleString()}`;
  };

  const handlePay = () => {
    if (!picked) return;
    if (picked.customPricing) {
      setEnquiryOpen(true);
      return;
    }
    setPaymentOpen(true);
  };

  return (
    <OnboardingLayout
      step={1}
      title="Choose your plan"
      subtitle="Pick the tier that fits your fleet. You can change anytime in Settings."
    >
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBilling(cycle)}
              className={cn(
                "rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                billing === cycle
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cycle}
              {cycle === "yearly" && (
                <span className="ml-1.5 text-[10px] text-success">
                  -{plans.find((plan) => plan.yearlyDiscountPercent)?.yearlyDiscountPercent ?? 10}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {plansQuery.isPending ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading subscription plans...
        </div>
      ) : plansQuery.isError ? (
        <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mb-2 h-5 w-5 text-destructive" />
          <p className="text-sm font-medium">We couldn't load subscription plans.</p>
          <Button variant="outline" className="mt-4" onClick={() => plansQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          No active subscription plans are available.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const price = getPrice(plan.monthlyPriceNgn, plan.yearlyMonthlyEquivalentNgn);
            const isPicked = pickedTier === plan.tier;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPickedTier(plan.tier)}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5 text-left transition-all",
                  plan.badge ? "border-primary/60 shadow-md" : "border-border",
                  isPicked && "border-primary ring-2 ring-primary",
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-foreground">
                    {plan.customPricing ? "Custom" : formatPrice(price)}
                  </span>
                  {!plan.customPricing && (
                    <span className="text-xs text-muted-foreground">
                      /{billing === "monthly" ? "month" : "year"}
                    </span>
                  )}
                </div>
                <ul className="mb-4 flex-1 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-xs">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md border text-xs font-semibold",
                    isPicked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  {isPicked ? "Selected" : plan.ctaLabel}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Plan limits & capabilities</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {picked ? `Showing limits for ${picked.name}` : "Select a plan above to see its limits"}
          </span>
        </div>

        {picked ? (
          <dl className="mt-4 flex flex-wrap gap-3">
            {[
              { icon: Truck, label: "Active vehicles", value: picked.maxActiveVehicles },
              { icon: Users, label: "Platform users", value: picked.maxUsers },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex min-w-[160px] flex-1 items-start gap-2.5 rounded-lg border border-border/50 bg-card/60 p-3"
                >
                  <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {formatPlanLimit(item.value)}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Pick a plan above to preview its vehicle and user limits.
          </p>
        )}
      </div>

      {capsQuery.data && (
        <div className="mt-4 rounded-xl border border-border/60 bg-card/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current subscription caps ({capsQuery.data.data.planName ?? capsQuery.data.data.planCode})
          </p>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Cpu, label: "Devices", value: capsQuery.data.data.maxDevices },
              { icon: Smartphone, label: "SIMs", value: capsQuery.data.data.maxSims },
              { icon: Users, label: "Users", value: capsQuery.data.data.maxUsers },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="ml-auto font-semibold">{formatCurrentCap(item.value)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      <div className="mt-6 inline-flex w-fit items-center gap-3 self-start rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <Label
          htmlFor="currency-toggle"
          className={cn(
            "text-xs font-semibold transition-colors",
            !currencyUsd ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Naira (₦)
        </Label>
        <Switch
          id="currency-toggle"
          checked={currencyUsd}
          onCheckedChange={setCurrencyUsd}
          aria-label="Toggle currency between Naira and USD"
        />
        <Label
          htmlFor="currency-toggle"
          className={cn(
            "text-xs font-semibold transition-colors",
            currencyUsd ? "text-foreground" : "text-muted-foreground",
          )}
        >
          USD ($)
        </Label>
      </div>

      {exchangeRateQuery.data && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {`1 USD = ₦${ngnPerUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })} (${exchangeRateQuery.data.data.source})`}
        </p>
      )}

      <div className="mt-8 flex justify-end border-t border-border/60 pt-6">
        <Button onClick={handlePay} disabled={!picked} size="lg" className="min-w-[180px]">
          <CreditCard className="mr-2 h-4 w-4" />
          {picked?.customPricing ? "Get in touch" : "Pay & Activate"}
        </Button>
      </div>

      {picked?.customPricing && (
        <EnterpriseEnquiryDialog
          open={enquiryOpen}
          onOpenChange={setEnquiryOpen}
          planName={picked.name}
        />
      )}

      {picked && !picked.customPricing && (
        <PaymentGatewayDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          context={{ type: "subscription", planName: picked.name, billingCycle: billing }}
          onPay={({ gateway, phone }) =>
            paymentMutation.mutateAsync({
              data: { planCode: picked.code, billingCycle: billing, gateway, phone },
            }).then((res) => res.data)
          }
        />
      )}
    </OnboardingLayout>
  );
}
