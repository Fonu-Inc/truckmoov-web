import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelected?: () => void;
}

type BillingMode = "prepaid" | "postpaid";

const PLANS: Array<{
  id: string;
  name: string;
  mode: BillingMode;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  recommended?: boolean;
  isCustom?: boolean;
}> = [
  // Prepaid plans
  {
    id: "prepaid-starter",
    name: "Starter",
    mode: "prepaid",
    priceMonthly: 50_000,
    priceYearly: 540_000,
    description: "For small fleets getting started",
    features: ["Up to 25 vehicles", "Basic fleet management", "2 users", "WhatsApp messaging"],
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
  },
  // Postpaid plans (single set price — no monthly/yearly toggle)
  {
    id: "postpaid-business",
    name: "Business",
    mode: "postpaid",
    priceMonthly: 120_000,
    priceYearly: 120_000,
    description: "Pay-as-you-go for active fleets",
    features: ["Up to 75 vehicles", "10,000 messages", "1,000 voice mins", "Standard rates"],
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
  },
];

export function SubscriptionModal({ open, onOpenChange, onSelected }: SubscriptionModalProps) {
  const { setSelectedPlan, selectedPlan } = useOnboardingStore();
  const [mode, setMode] = useState<BillingMode>("prepaid");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [pending, setPending] = useState<string | null>(null);

  const visiblePlans = PLANS.filter((p) => p.mode === mode);

  const handleSelect = async (planId: string, planName: string) => {
    setPending(planId);
    await new Promise((r) => setTimeout(r, 600));
    setSelectedPlan(planId);
    toast.success(`${planName} plan selected`, {
      description: "You're all set — you can change this anytime in Settings.",
    });
    setPending(null);
    onSelected?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-2 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl">Choose your plan</DialogTitle>
          <DialogDescription>
            Pick a billing model and the tier that fits your fleet — change anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Billing-mode toggle (Prepaid / Postpaid) */}
        <div className="flex justify-center px-6 pt-2">
          <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
            {(["prepaid", "postpaid"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
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
        </div>

        {/* Monthly / Yearly toggle — prepaid only */}
        {mode === "prepaid" && (
          <div className="flex justify-center px-6 pt-3">
            <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
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
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 py-6">
          {visiblePlans.map((plan) => {
            const price =
              mode === "prepaid" && billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
            const isSelected = selectedPlan === plan.id;
            const isPending = pending === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border p-4 transition-all",
                  plan.recommended ? "border-primary shadow-lg" : "border-border",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                {plan.recommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Recommended
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-foreground">
                    {plan.isCustom ? "Custom" : `₦${price.toLocaleString()}`}
                  </span>
                  {!plan.isCustom && mode === "prepaid" && (
                    <span className="text-xs text-muted-foreground">
                      /{billing === "monthly" ? "month" : "year"}
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant={plan.recommended ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleSelect(plan.id, plan.name)}
                  disabled={isPending}
                >
                  {isPending ? "Selecting..." : isSelected ? "Selected" : "Select Plan"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
