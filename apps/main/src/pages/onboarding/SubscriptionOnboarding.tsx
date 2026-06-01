import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shadcn/button";
import { Switch } from "@/components/shadcn/switch";
import { Label } from "@/components/shadcn/label";
import { Check, Info, CreditCard, Truck, Users, MessageSquare, Phone, MapPin, HardDrive, Headphones, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { OnboardingLayout } from "./OnboardingLayout";
import { useFxRate } from "@/hooks/usePlatformSettings";
import { PaymentGateModal } from "@/components/onboarding/PaymentGateModal";
import { PostpaidActivationModal } from "@/components/onboarding/PostpaidActivationModal";

const NGN_PER_USD_FALLBACK = 1600;

type BillingMode = "prepaid" | "postpaid";

type LimitValue = string | number;
interface PlanLimits {
  vehicles: LimitValue;
  drivers: LimitValue;
  users: LimitValue;
  geofences: LimitValue;
  storageGb: LimitValue;
  monthlyMessages?: LimitValue;
  monthlyVoiceMinutes?: LimitValue;
  apiRequestsPerDay: LimitValue;
  support: string;
}

const PLANS: Array<{
  id: string;
  name: string;
  mode: BillingMode;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  limits: PlanLimits;
  recommended?: boolean;
  isCustom?: boolean;
}> = [
  {
    id: "prepaid-starter",
    name: "Starter",
    mode: "prepaid",
    priceMonthly: 50_000,
    priceYearly: 540_000,
    description: "For small fleets getting started",
    features: ["Up to 25 vehicles", "Basic fleet management", "2 users", "WhatsApp messaging"],
    limits: {
      vehicles: 25,
      drivers: 25,
      users: 2,
      geofences: 10,
      storageGb: 5,
      monthlyMessages: 1_000,
      monthlyVoiceMinutes: 100,
      apiRequestsPerDay: 5_000,
      support: "Email (48h SLA)",
    },
  },
  {
    id: "prepaid-pro",
    name: "Professional",
    mode: "prepaid",
    priceMonthly: 150_000,
    priceYearly: 1_620_000,
    description: "Most popular for growing fleets",
    features: ["Up to 100 vehicles", "Full features", "10 users", "AI load matching", "Priority support"],
    recommended: true,
    limits: {
      vehicles: 100,
      drivers: 120,
      users: 10,
      geofences: 100,
      storageGb: 50,
      monthlyMessages: 10_000,
      monthlyVoiceMinutes: 1_000,
      apiRequestsPerDay: 50_000,
      support: "Priority chat +\nemail (8h SLA)",
    },
  },
  {
    id: "prepaid-enterprise",
    name: "Enterprise",
    mode: "prepaid",
    priceMonthly: 0,
    priceYearly: 0,
    isCustom: true,
    description: "Unlimited scale & custom workflows",
    features: ["100+ vehicles", "Custom integrations", "Dedicated account manager", "Custom SLA"],
    limits: {
      vehicles: "Unlimited",
      drivers: "Unlimited",
      users: "Unlimited",
      geofences: "Unlimited",
      storageGb: "Custom",
      monthlyMessages: "Custom bundle",
      monthlyVoiceMinutes: "Custom bundle",
      apiRequestsPerDay: "Custom",
      support: "Dedicated CSM (custom SLA)",
    },
  },
  {
    id: "postpaid-business",
    name: "Business",
    mode: "postpaid",
    priceMonthly: 120_000,
    priceYearly: 120_000,
    description: "Pay-as-you-go for active fleets",
    features: ["Up to 75 vehicles", "10,000 messages", "1,000 voice mins", "Standard rates"],
    limits: {
      vehicles: 75,
      drivers: 90,
      users: 8,
      geofences: 75,
      storageGb: 25,
      monthlyMessages: 10_000,
      monthlyVoiceMinutes: 1_000,
      apiRequestsPerDay: 25_000,
      support: "Email + chat (24h SLA)",
    },
  },
  {
    id: "postpaid-corporate",
    name: "Corporate",
    mode: "postpaid",
    priceMonthly: 350_000,
    priceYearly: 350_000,
    description: "High-volume operations",
    features: ["Up to 200 vehicles", "20,000 messages", "2,000 voice mins", "Discounted rates"],
    recommended: true,
    limits: {
      vehicles: 200,
      drivers: 250,
      users: 25,
      geofences: 200,
      storageGb: 100,
      monthlyMessages: 20_000,
      monthlyVoiceMinutes: 2_000,
      apiRequestsPerDay: 100_000,
      support: "Priority chat + phone (4h SLA)",
    },
  },
  {
    id: "postpaid-enterprise",
    name: "Enterprise",
    mode: "postpaid",
    priceMonthly: 0,
    priceYearly: 0,
    isCustom: true,
    description: "Custom postpaid bundle",
    features: ["200+ vehicles", "Custom bundle", "Negotiated rates", "Dedicated support"],
    limits: {
      vehicles: "Unlimited",
      drivers: "Unlimited",
      users: "Unlimited",
      geofences: "Unlimited",
      storageGb: "Custom",
      monthlyMessages: "Negotiated bundle",
      monthlyVoiceMinutes: "Negotiated bundle",
      apiRequestsPerDay: "Custom",
      support: "Dedicated CSM (custom SLA)",
    },
  },
];

function formatLimit(v: LimitValue): string {
  return typeof v === "number" ? v.toLocaleString() : v;
}

export default function SubscriptionOnboarding() {
  const navigate = useNavigate();
  const { selectedPlan, setSelectedPlan, completeStep } = useOnboardingStore();
  const [mode, setMode] = useState<BillingMode>("prepaid");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currencyUsd, setCurrencyUsd] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(selectedPlan);
  const [payOpen, setPayOpen] = useState(false);
  const [postpaidOpen, setPostpaidOpen] = useState(false);
  const { rate: fxRate } = useFxRate();
  const ngnPerUsd = fxRate || NGN_PER_USD_FALLBACK;

  const visiblePlans = PLANS.filter((p) => p.mode === mode);
  const picked = PLANS.find((p) => p.id === pickedId) ?? null;

  const formatPrice = (ngn: number) => {
    if (currencyUsd) {
      const usd = ngn / ngnPerUsd;
      return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `₦${ngn.toLocaleString()}`;
  };

  const pickedPrice = picked
    ? mode === "prepaid" && billing === "yearly"
      ? picked.priceYearly
      : picked.priceMonthly
    : 0;
  const pickedAmountLabel = picked?.isCustom ? "Custom" : formatPrice(pickedPrice);

  const handlePay = () => {
    if (!picked) return;
    if (picked.isCustom) {
      toast.info("Our team will reach out about your custom plan.");
      return;
    }
    if (picked.mode === "postpaid") {
      setPostpaidOpen(true);
      return;
    }
    setPayOpen(true);
  };

  const handlePaymentConfirmed = () => {
    if (!picked) return;
    setSelectedPlan(picked.id);
    completeStep("subscription");
    toast.success("Subscription activated", {
      description: `${picked.name} plan is now active. Welcome aboard!`,
    });
    navigate("/onboarding/kyc");
  };

  return (
    <OnboardingLayout
      step={1}
      title="Choose your plan"
      subtitle="Pick a billing model and the tier that fits your fleet. You can change anytime in Settings."
    >
      {/* Top bar: mode tabs (left) + billing duration (right) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          {(["prepaid", "postpaid"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setPickedId(null);
              }}
              className={cn(
                "rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "prepaid" && (
          <div className="inline-flex rounded-lg border border-border bg-muted p-0.5 sm:ml-auto">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                  billing === b
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {b}
                {b === "yearly" && (
                  <span className="ml-1.5 text-[10px] text-success">−10%</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {visiblePlans.map((plan) => {
          const price =
            mode === "prepaid" && billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const isPicked = pickedId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPickedId(plan.id)}
              className={cn(
                "relative flex flex-col rounded-xl border p-5 text-left transition-all",
                plan.recommended ? "border-primary/60 shadow-md" : "border-border",
                isPicked && "ring-2 ring-primary border-primary"
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Recommended
                </span>
              )}
              <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{plan.description}</p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">
                  {plan.isCustom ? "Custom" : formatPrice(price)}
                </span>
                {!plan.isCustom && mode === "prepaid" && (
                  <span className="text-xs text-muted-foreground">
                    /{billing === "monthly" ? "month" : "year"}
                  </span>
                )}
              </div>
              <ul className="mb-4 flex-1 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div
                className={cn(
                  "flex h-8 w-full items-center justify-center rounded-md border text-xs font-semibold",
                  isPicked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                )}
              >
                {isPicked ? "Selected" : "Select Plan"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Plan limits & capabilities — dynamic to selected plan */}
      <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Plan limits & capabilities
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {picked
              ? `Showing limits for ${picked.name}`
              : "Select a plan above to see its limits"}
          </span>
        </div>

        {picked ? (
          <dl className="mt-4 flex flex-wrap gap-3">
            {[
              { icon: Truck, label: "Vehicles", value: picked.limits.vehicles },
              { icon: Users, label: "Drivers", value: picked.limits.drivers },
              { icon: Users, label: "Platform users", value: picked.limits.users },
              { icon: MapPin, label: "Geofences", value: picked.limits.geofences },
              { icon: HardDrive, label: "Storage", value: typeof picked.limits.storageGb === "number" ? `${picked.limits.storageGb} GB` : picked.limits.storageGb },
              picked.limits.monthlyMessages !== undefined && {
                icon: MessageSquare,
                label: "Messages / month",
                value: picked.limits.monthlyMessages,
              },
              picked.limits.monthlyVoiceMinutes !== undefined && {
                icon: Phone,
                label: "Voice mins / month",
                value: picked.limits.monthlyVoiceMinutes,
              },
              { icon: Gauge, label: "API requests / day", value: picked.limits.apiRequestsPerDay },
              { icon: Headphones, label: "Support", value: picked.limits.support },
            ]
              .filter(Boolean)
              .map((item) => {
                const it = item as { icon: typeof Gauge; label: string; value: LimitValue };
                const Icon = it.icon;
                return (
                  <div
                    key={it.label}
                    className="flex min-w-[160px] flex-1 items-start gap-2.5 rounded-lg border border-border/50 bg-card/60 p-3"
                  >
                    <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {it.label}
                      </dt>
                      <dd className="text-sm font-semibold text-foreground whitespace-pre-line">
                        {formatLimit(it.value)}
                      </dd>
                    </div>
                  </div>
                );
              })}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Pick a plan above to preview its vehicle, driver, user and usage limits.
          </p>
        )}
      </div>

      {/* Currency toggle */}
      <div className="mt-6 inline-flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 self-start w-fit">
        <Label
          htmlFor="currency-toggle"
          className={cn(
            "text-xs font-semibold transition-colors",
            !currencyUsd ? "text-foreground" : "text-muted-foreground"
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
            currencyUsd ? "text-foreground" : "text-muted-foreground"
          )}
        >
          USD ($)
        </Label>
      </div>

      {/* Pay & activate footer */}
      <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-primary" />
          {picked?.mode === "postpaid"
            ? "Postpaid — no upfront charge. Billed monthly in arrears (Net 14)."
            : "Mock payment — no card will be charged."}
        </div>
        <Button onClick={handlePay} disabled={!picked} size="lg" className="min-w-[180px]">
          <CreditCard className="mr-2 h-4 w-4" />
          {picked?.mode === "postpaid" ? "Activate Postpaid" : "Pay & Activate"}
        </Button>
      </div>

      {picked && picked.mode === "prepaid" && (
        <PaymentGateModal
          open={payOpen}
          onOpenChange={setPayOpen}
          planName={picked.name}
          amountLabel={pickedAmountLabel}
          onConfirmed={handlePaymentConfirmed}
        />
      )}

      {picked && picked.mode === "postpaid" && (
        <PostpaidActivationModal
          open={postpaidOpen}
          onOpenChange={setPostpaidOpen}
          planName={picked.name}
          monthlyFeeLabel={pickedAmountLabel}
          onConfirmed={handlePaymentConfirmed}
        />
      )}
    </OnboardingLayout>
  );
}
