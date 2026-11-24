import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  MessageSquare,
  Phone,
  Wifi,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { formatCurrency } from "@/lib/currency";

type OrgType = "FLEET_PROVIDER" | "ENTERPRISE" | "AGGREGATOR" | "OWNER_OPERATOR";
type BillingCycle = "MONTHLY" | "YEARLY";

type OnboardingPlanStepProps = {
  orgType: OrgType;
  orgName: string;
  selectedPlanKey: string | null;
  billingCycle: BillingCycle;
  onSelectPlan: (planKey: string) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  vehicleCount?: number | null;
  networkVehicleCount?: number | null;
  monthlyShipments?: number | null;
};

const ORG_TYPE_CONFIG: Record<OrgType, {
  subtitle: string;
  metricLabel: string;
  metricHelper: string;
  helpTooltipLabel: string;
  helpTooltipContent: string;
}> = {
  FLEET_PROVIDER: {
    subtitle: "Pricing is based on active tracked vehicles.",
    metricLabel: "active vehicles",
    metricHelper: "Vehicles with active tracking telemetry in the current billing period.",
    helpTooltipLabel: "What is an active vehicle?",
    helpTooltipContent: "An active vehicle is a vehicle with a connected tracking device sending telemetry in the current billing period.",
  },
  AGGREGATOR: {
    subtitle: "Pricing is based on network vehicles (vehicles across your owner-operators).",
    metricLabel: "network vehicles",
    metricHelper: "Vehicles across all owner-operators linked to this aggregator.",
    helpTooltipLabel: "What is a network vehicle?",
    helpTooltipContent: "Vehicles across all owner-operators linked to this aggregator.",
  },
  OWNER_OPERATOR: {
    subtitle: "Pricing is based on your vehicles.",
    metricLabel: "vehicles",
    metricHelper: "Vehicles owned and operated under your owner-operator organization.",
    helpTooltipLabel: "What counts as a vehicle?",
    helpTooltipContent: "Vehicles owned and operated under your owner-operator organization.",
  },
  ENTERPRISE: {
    subtitle: "Pricing is based on monthly shipments + integration needs.",
    metricLabel: "shipments",
    metricHelper: "Jobs/shipments created and actively tracked per month.",
    helpTooltipLabel: "How is pricing determined?",
    helpTooltipContent: "Enterprise pricing is customized based on your monthly shipment volume, number of transport partners, and integration requirements.",
  },
};

const BADGE_STYLES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  highlight: "bg-primary text-primary-foreground",
  premium: "bg-accent text-accent-foreground",
  dark: "bg-foreground text-background",
};

function getRecommendedPlanKey(
  orgType: OrgType,
  vehicleCount?: number | null,
  networkVehicleCount?: number | null,
  monthlyShipments?: number | null,
): string | null {
  if (orgType === "FLEET_PROVIDER" && vehicleCount != null) {
    if (vehicleCount <= 10)
      return "FLEET_STARTER";
    if (vehicleCount <= 50)
      return "FLEET_GROWTH";
    if (vehicleCount <= 200)
      return "FLEET_SCALE";
    return "FLEET_ENTERPRISE";
  }
  if (orgType === "AGGREGATOR" && networkVehicleCount != null) {
    if (networkVehicleCount <= 20)
      return "AGG_STARTER";
    if (networkVehicleCount <= 100)
      return "AGG_GROWTH";
    if (networkVehicleCount <= 300)
      return "AGG_SCALE";
    return "AGG_ENTERPRISE";
  }
  if (orgType === "OWNER_OPERATOR" && vehicleCount != null) {
    if (vehicleCount <= 1)
      return "OO_FREE";
    if (vehicleCount <= 3)
      return "OO_PRO";
    if (vehicleCount <= 10)
      return "OO_PRO_PLUS";
    return "OO_FLEET_TRANSITION";
  }
  if (orgType === "ENTERPRISE" && monthlyShipments != null) {
    if (monthlyShipments <= 500)
      return "ENT_PILOT";
    if (monthlyShipments <= 2000)
      return "ENT_GROWTH";
    return "ENT_TRANSFORM";
  }
  return null;
}

export function OnboardingPlanStep({
  orgType,
  orgName,
  selectedPlanKey,
  billingCycle,
  onSelectPlan,
  onBillingCycleChange,
  vehicleCount,
  networkVehicleCount,
  monthlyShipments,
}: OnboardingPlanStepProps) {
  const allPlans: any[] = [];
  const getPlansForOrgType = (_orgType: string): any[] => [];
  const isLoading = false;
  const config = ORG_TYPE_CONFIG[orgType];

  const plans = useMemo(
    () => {
      if (!allPlans)
        return [];
      return getPlansForOrgType(orgType).filter(p => p.is_active);
    },
    [
      allPlans,
      orgType,
      getPlansForOrgType,
    ],
  );

  const recommendedKey = useMemo(
    () => getRecommendedPlanKey(
      orgType,
      vehicleCount,
      networkVehicleCount,
      monthlyShipments,
    ),
    [
      orgType,
      vehicleCount,
      networkVehicleCount,
      monthlyShipments,
    ],
  );

  const hasYearlyToggle = plans.some(p => (p as any).yearly_price_ngn > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading plans...</span>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No active subscription plans configured for this organization type.</p>
        <p className="text-sm mt-1">Please configure service tiers in Platform Settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            Choose a plan for
            {" "}
            {orgName || "this organization"}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-[240px]"
              >
                <p className="font-medium text-xs">{config.helpTooltipLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">{config.helpTooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      {/* Billing Cycle Toggle */}
      {hasYearlyToggle && (
        <div className="flex items-center justify-center gap-3 p-2 rounded-lg bg-muted/50">
          <button
            onClick={() => onBillingCycleChange("MONTHLY")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "MONTHLY"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onBillingCycleChange("YEARLY")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              billingCycle === "YEARLY"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-success/10 text-success border-0"
            >
              Save 20%
            </Badge>
          </button>
        </div>
      )}

      {/* Plan Cards */}
      <div className={`grid gap-4 ${
        plans.length <= 3 ? `grid-cols-1 md:grid-cols-${plans.length}` : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      }`}
      >
        {plans.map((plan) => {
          const p = plan as any;
          const isSelected = selectedPlanKey === p.plan_key;
          const isRecommended = recommendedKey === p.plan_key;
          const isCustomPricing = p.pricing_display_mode === "CUSTOM";
          const isContactSales = p.cta_type === "CONTACT_SALES";
          const badgeStyle = BADGE_STYLES[p.badge_style || "neutral"] || BADGE_STYLES.neutral;

          const price = billingCycle === "YEARLY" && p.yearly_price_ngn > 0
            ? Math.round(p.yearly_price_ngn / 12)
            : p.price_ngn;

          const yearlyTotal = p.yearly_price_ngn || 0;

          const metricLine = p.metric_line_template
            ? p.metric_line_template.replace(
                "{limit}",
                p.metric_limit || "∞",
              )
            : null;

          const footerHelper = p.footer_helper_template && p.metric_limit && price > 0
            ? p.footer_helper_template
                .replace(
                  "{per_vehicle}",
                  Math.round(price / p.metric_limit).toLocaleString(),
                )
                .replace(
                  "{limit}",
                  p.metric_limit,
                )
            : null;

          // Parse features - handle both jsonb array and text[]
          let bullets: string[] = [];
          if (Array.isArray(p.features)) {
            bullets = p.features;
          }
          else if (typeof p.features === "string") {
            try {
              bullets = JSON.parse(p.features);
            }
            catch { bullets = []; }
          }

          return (
            <Card
              key={p.plan_key || p.id}
              className={`relative flex flex-col transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/40"
              } ${isContactSales ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => !isContactSales && onSelectPlan(p.plan_key)}
            >
              {/* Top badges */}
              <div className="absolute -top-2.5 left-0 right-0 flex justify-center gap-1.5">
                {isRecommended && (
                  <Badge className="bg-success text-success-foreground text-[10px] px-2">
                    Recommended
                  </Badge>
                )}
                {p.badge_text && (
                  <Badge className={`text-[10px] px-2 ${badgeStyle}`}>
                    {p.badge_text}
                  </Badge>
                )}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-5">
                <CardTitle className="text-lg">{p.name}</CardTitle>

                {/* Price */}
                <div className="mt-1">
                  {isCustomPricing
                    ? (
                        <p className="text-xl font-bold text-foreground">{p.custom_price_text || "Custom pricing"}</p>
                      )
                    : (
                        <>
                          <span className="text-2xl font-bold text-foreground">
                            {price === 0 ? "Free" : formatCurrency(price)}
                          </span>
                          {price > 0 && (
                            <span className="text-muted-foreground text-sm">/mo</span>
                          )}
                          {billingCycle === "YEARLY" && yearlyTotal > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(yearlyTotal)}
                              {" "}
                              billed yearly
                            </p>
                          )}
                        </>
                      )}
                </div>

                {/* Metric line */}
                {metricLine && (
                  <p className="text-xs text-muted-foreground mt-1">{metricLine}</p>
                )}

                {/* Trial */}
                {p.trial_days > 0 && (
                  <p className="text-xs text-success mt-1">
                    {p.trial_days}
                    -day free trial
                  </p>
                )}
                {p.trial_days === 0 && isContactSales && (
                  <p className="text-xs text-muted-foreground mt-1">Book a demo</p>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Bullets */}
                <ul className="space-y-1.5 text-sm flex-1">
                  {bullets.map((bullet: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2"
                    >
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer helper */}
                {footerHelper && (
                  <p className="text-[11px] text-muted-foreground text-center mt-3 pt-2 border-t border-border">
                    {footerHelper}
                  </p>
                )}

                {/* CTA */}
                <div className="mt-3">
                  {isContactSales ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Could open a contact form or mailto
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      {p.cta_label || "Talk to Sales"}
                    </Button>
                  ) : (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlan(p.plan_key);
                      }}
                    >
                      {isSelected
                        ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Selected
                            </>
                          )
                        : (
                            p.cta_label || "Select Plan"
                          )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Usage Strip */}
      <UsageRatesStrip />
    </div>
  );
}

const ICON_MAP: Record<string, typeof Wifi> = {
  wifi: Wifi,
  message: MessageSquare,
  phone: Phone,
  brain: Brain,
};

function UsageRatesStrip() {
  const [
    expanded,
    setExpanded,
  ] = useState(false);
  const [rates] = useState<{
    communication_type: string; rate_ngn: number; rate_unit: string; description: string | null;
  }[]>([]);
  const [loadingRates] = useState(false);
  const [
    summaryItems,
    setSummaryItems,
  ] = useState<{
    icon_key: string; label: string;
  }[]>([]);
  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true);

  useEffect(
    () => {
      setSummaryItems([]);
      setLoadingSummary(false);
    },
    [],
  );

  const toggleExpand = () => {
    setExpanded(v => !v);
  };

  const RATE_ICONS: Record<string, typeof Wifi> = {
    sms: MessageSquare,
    whatsapp: MessageSquare,
    call: Phone,
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">Connectivity & usage (pay as you grow)</p>
        <p className="text-xs text-muted-foreground">FleetPro is powered by Fonu. Only pay for what you use.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {loadingSummary
          ? (
              <div className="col-span-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {" "}
                Loading...
              </div>
            )
          : summaryItems.map((item, idx) => {
              const Icon = ICON_MAP[item.icon_key] || Wifi;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              );
            })}
      </div>
      <button
        onClick={toggleExpand}
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        {expanded ? "Hide" : "View"}
        {" "}
        usage rates
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="pt-2 border-t border-border space-y-1.5">
          {loadingRates
            ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {" "}
                  Loading rates...
                </div>
              )
            : rates.length === 0
              ? (
                  <p className="text-xs text-muted-foreground">No usage rates configured yet.</p>
                )
              : (
                  rates.map((rate) => {
                    const Icon = RATE_ICONS[rate.communication_type] || Wifi;
                    return (
                      <div
                        key={rate.communication_type}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <span className="capitalize">{rate.description || rate.communication_type}</span>
                        </div>
                        <span className="font-medium text-foreground">
                          {formatCurrency(rate.rate_ngn)}
                          {" "}
                          <span className="text-muted-foreground font-normal">
                            /
                            {rate.rate_unit.replace(
                              "per_",
                              "",
                            )}
                          </span>
                        </span>
                      </div>
                    );
                  })
                )}
        </div>
      )}
    </div>
  );
}
