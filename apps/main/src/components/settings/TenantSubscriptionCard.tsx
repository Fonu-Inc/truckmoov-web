import type {
  OnboardingSubscriptionCaps, SubscriptionPlan,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingPlansQueryOptions,
  getOnboardingStatusQueryOptions,
  getOnboardingSubscriptionCapsQueryOptions,
  getOrganizationUsersQueryOptions,
  getSimsQueryOptions,
} from "@truckmoov/api/auth";
import {
  getDevicesQueryOptions, getVehiclesSummaryQueryOptions,
} from "@truckmoov/api/fleet";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Check,
  Cpu,
  CreditCard,
  Loader2,
  Lock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

// Tier order drives the upgrade/downgrade lists and locked-feature discovery.
const TIER_ORDER: SubscriptionPlan["tier"][] = [
  "starter",
  "professional",
  "enterprise",
];

type UsageKey = "vehicles" | "users" | "devices" | "sims";

type UsageStat = {
  current: number;
  limit: number | null;
  percentage: number;
};

// ponytail: the markup below reads a snake_case plan shape. Map the API's
// SubscriptionPlan into it once instead of rewriting ~700 lines of JSX.
type CardPlan = {
  id: string;
  name: string;
  tier: string;
  price_ngn: number;
  custom_pricing: boolean;
  billing_cycle: "monthly" | "yearly";
  max_vehicles: number | null;
  max_users: number | null;
  max_devices: number | null;
  max_sims: number | null;
  features: string[];
  is_popular: boolean;
  trial_days: number;
  yearly_discount_percent: number;
  tier_badge_color: string;
};

/**
 * `caps` is the tenant's own subscription — pass it only for the active plan.
 * Other plans in the catalogue have no device/SIM figures of their own.
 */
function toCardPlan(plan: SubscriptionPlan, caps: OnboardingSubscriptionCaps | null): CardPlan {
  return {
    id: plan.id ?? plan.code,
    name: plan.name,
    tier: plan.tier,
    // ponytail: no endpoint returns the tenant's billing cycle, so everything
    // is priced monthly. Read it off the subscription once the server sends it.
    price_ngn: plan.monthlyPriceNgn ?? 0,
    custom_pricing: plan.customPricing,
    billing_cycle: "monthly",
    max_vehicles: plan.maxActiveVehicles,
    max_users: caps?.maxUsers ?? plan.maxUsers,
    max_devices: caps?.maxDevices ?? null,
    max_sims: caps?.maxSims ?? null,
    features: plan.features,
    is_popular: Boolean(plan.badge),
    trial_days: plan.trialDays ?? 0,
    yearly_discount_percent: plan.yearlyDiscountPercent ?? 0,
    tier_badge_color: "hsl(var(--primary))",
  };
}

function toUsageStat(current: number, limit: number | null): UsageStat {
  return {
    current,
    limit,
    percentage: limit ? Math.min(
      100,
      Math.round((current / limit) * 100),
    ) : 0,
  };
}

function toFeature(name: string, isIncluded: boolean) {
  return {
    feature_key: name,
    feature_name: name,
    is_included: isIncluded,
    usage_limit: null as number | null,
  };
}

export function TenantSubscriptionCard() {
  const { format } = useCurrency();
  const plansQuery = useQuery(getOnboardingPlansQueryOptions());
  const capsQuery = useQuery(getOnboardingSubscriptionCapsQueryOptions());
  const statusQuery = useQuery(getOnboardingStatusQueryOptions());
  const vehiclesQuery = useQuery(getVehiclesSummaryQueryOptions());
  const usersQuery = useQuery(getOrganizationUsersQueryOptions());
  // ponytail: GET /devices returns a bare array with no total, so the count is
  // the list length. Switch to a /devices/summary total if one is ever added.
  const devicesQuery = useQuery(getDevicesQueryOptions());
  const simsQuery = useQuery(getSimsQueryOptions({
    params: {
      page: 1, limit: 1,
    },
  }));

  const [
    upgradeDialogOpen,
    setUpgradeDialogOpen,
  ] = useState(false);
  const [
    downgradeDialogOpen,
    setDowngradeDialogOpen,
  ] = useState(false);
  const [isSubmitting] = useState<string | null>(null);

  // ponytail: plan changes still stop at a toast. Wire the buttons to
  // POST /onboarding/payment/intent (priced plans) and
  // POST /onboarding/enterprise/enquiry (customPricing) when self-serve lands.
  const handleContactSales = async (_plan: CardPlan, _action: "upgrade" | "downgrade") => {
    toast.info("Coming soon");
  };

  const caps = capsQuery.data?.data ?? null;
  const plans = plansQuery.data?.data.plans ?? [];
  const planCode = caps?.planCode ?? statusQuery.data?.data.planCode ?? null;
  const activePlan = plans.find(plan => plan.code === planCode) ?? null;
  const currentPlan = activePlan
    ? toCardPlan(
        activePlan,
        caps,
      )
    : null;

  const currentTier = activePlan ? TIER_ORDER.indexOf(activePlan.tier) : -1;
  const higherPlans = activePlan
    ? plans.filter(plan => TIER_ORDER.indexOf(plan.tier) > currentTier)
    : [];
  const upgradeOptions = higherPlans.map(plan => toCardPlan(
    plan,
    null,
  ));
  const downgradeOptions = activePlan
    ? plans
        .filter(plan => TIER_ORDER.indexOf(plan.tier) < currentTier)
        .map(plan => toCardPlan(
          plan,
          null,
        ))
    : [];

  const usageStats: Record<UsageKey, UsageStat> = {
    vehicles: toUsageStat(
      vehiclesQuery.data?.data.total ?? 0,
      currentPlan?.max_vehicles ?? null,
    ),
    users: toUsageStat(
      usersQuery.data?.data.users.length ?? 0,
      currentPlan?.max_users ?? null,
    ),
    devices: toUsageStat(
      devicesQuery.data?.data.length ?? 0,
      currentPlan?.max_devices ?? null,
    ),
    sims: toUsageStat(
      simsQuery.data?.data.total ?? 0,
      currentPlan?.max_sims ?? null,
    ),
  };

  const isAtLimit = (key: UsageKey) => {
    const stat = usageStats[key];
    return stat.limit !== null && stat.current >= stat.limit;
  };
  const isApproachingLimit = (key: UsageKey) => {
    const stat = usageStats[key];
    return stat.limit !== null && stat.percentage >= 80;
  };

  const isLoading = plansQuery.isPending || capsQuery.isPending;

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlan) {
    const failed = plansQuery.isError || capsQuery.isError;
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and resource usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/60 p-8 text-center">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium">
              {failed ? "Couldn't load your subscription" : "No active subscription"}
            </p>
            <p className="text-sm text-muted-foreground">
              {failed
                ? "The subscription service didn't respond. Try again in a moment."
                : "Choose a plan to activate your organisation's subscription."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void plansQuery.refetch();
                void capsQuery.refetch();
              }}
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscriptionStatus = statusQuery.data?.data.subscriptionStatus ?? null;
  const isActive = subscriptionStatus === null || subscriptionStatus === "active";
  const includedFeatures = currentPlan.features.map(name => toFeature(
    name,
    true,
  ));
  const lockedFeatures = [...new Set(higherPlans.flatMap(plan => plan.features))]
    .filter(name => !currentPlan.features.includes(name))
    .map(name => toFeature(
      name,
      false,
    ));
  const hasWarnings = isApproachingLimit("vehicles") || isApproachingLimit("users") || isApproachingLimit("devices") || isApproachingLimit("sims");

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Your current plan and resource usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Overview */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{
                backgroundColor: currentPlan.tier_badge_color || "hsl(var(--primary))",
                color: "white",
              }}
            >
              {currentPlan.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-lg">
                  {currentPlan.name}
                  {" "}
                  Plan
                </h4>
                <Badge
                  className={cn(
                    "capitalize",
                    isActive
                      ? "bg-success/20 text-success border-success/30"
                      : "bg-warning/20 text-warning border-warning/30",
                  )}
                >
                  {subscriptionStatus?.replace(
                    /_/g,
                    " ",
                  ) ?? "Active"}
                </Badge>
                {currentPlan.is_popular && (
                  <Badge
                    variant="secondary"
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    {" "}
                    Popular
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                >
                  {currentPlan.billing_cycle === "yearly" ? "Yearly" : "Monthly"}
                  {" "}
                  Plan
                </Badge>
                {caps?.subscriptionActivatedAt && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    Active since
                    {" "}
                    {formatDate(caps.subscriptionActivatedAt)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {currentPlan.max_vehicles ? `Up to ${currentPlan.max_vehicles} vehicles` : "Unlimited vehicles"}
                {currentPlan.max_users ? `, ${currentPlan.max_users} users` : ", unlimited users"}
              </p>
              {currentPlan.trial_days > 0 && (
                <p className="text-xs text-primary mt-1">
                  {currentPlan.trial_days}
                  -day trial included
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {currentPlan.custom_pricing
                ? "Custom"
                : format(
                    currentPlan.price_ngn,
                    "NGN",
                  )}
              {!currentPlan.custom_pricing && (
                <span className="text-sm font-normal text-muted-foreground">
                  /
                  {currentPlan.billing_cycle}
                </span>
              )}
            </p>
            {currentPlan.yearly_discount_percent > 0 && (
              <p className="text-xs text-primary">
                {currentPlan.yearly_discount_percent}
                % off yearly
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {upgradeOptions.length > 0 && (
                <Dialog
                  open={upgradeDialogOpen}
                  onOpenChange={setUpgradeDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Upgrade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upgrade Your Plan</DialogTitle>
                      <DialogDescription>
                        Choose a plan with more resources and features
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {upgradeOptions.map(plan => (
                        <Card
                          key={plan.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary/50",
                            plan.is_popular && "border-primary",
                          )}
                        >
                          {plan.is_popular && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                              Recommended
                            </Badge>
                          )}
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              {plan.name}
                              {plan.tier && (
                                <Badge style={{ backgroundColor: plan.tier_badge_color }}>
                                  {plan.tier}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <span className="text-xl font-bold text-foreground">
                                {plan.custom_pricing
                                  ? "Custom"
                                  : format(
                                      plan.price_ngn,
                                      "NGN",
                                    )}
                              </span>
                              {!plan.custom_pricing && (
                                <span className="text-muted-foreground">
                                  /
                                  {plan.billing_cycle}
                                </span>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm space-y-1">
                              <p>
                                •
                                {plan.max_vehicles ?? "Unlimited"}
                                {" "}
                                vehicles
                              </p>
                              <p>
                                •
                                {plan.max_users ?? "Unlimited"}
                                {" "}
                                users
                              </p>
                            </div>
                            <Button
                              className="w-full mt-4"
                              onClick={() => handleContactSales(
                                plan,
                                "upgrade",
                              )}
                              disabled={isSubmitting === plan.id}
                            >
                              {isSubmitting === plan.id
                                ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Submitting...
                                    </>
                                  )
                                : (
                                    "Contact Sales"
                                  )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {downgradeOptions.length > 0 && (
                <Dialog
                  open={downgradeDialogOpen}
                  onOpenChange={setDowngradeDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                    >
                      <TrendingDown className="h-3 w-3" />
                      Downgrade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Downgrade Your Plan</DialogTitle>
                      <DialogDescription>
                        Switch to a lower-tier plan. Note: Resource limits will be reduced.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {downgradeOptions.map(plan => (
                        <Card
                          key={plan.id}
                          className="cursor-pointer transition-all hover:border-muted-foreground/50"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              {plan.name}
                              {plan.tier && (
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: plan.tier_badge_color, color: plan.tier_badge_color,
                                  }}
                                >
                                  {plan.tier}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <span className="text-xl font-bold text-foreground">
                                {plan.custom_pricing
                                  ? "Custom"
                                  : format(
                                      plan.price_ngn,
                                      "NGN",
                                    )}
                              </span>
                              {!plan.custom_pricing && (
                                <span className="text-muted-foreground">
                                  /
                                  {plan.billing_cycle}
                                </span>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm space-y-1 text-muted-foreground">
                              <p>
                                •
                                {plan.max_vehicles ?? "Unlimited"}
                                {" "}
                                vehicles
                              </p>
                              <p>
                                •
                                {plan.max_users ?? "Unlimited"}
                                {" "}
                                users
                              </p>
                            </div>
                            {/* Warning if current usage exceeds plan limits */}
                            {((plan.max_vehicles && usageStats.vehicles.current > plan.max_vehicles)
                              || (plan.max_users && usageStats.users.current > plan.max_users)) && (
                              <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20 text-warning text-xs">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                <span>Current usage exceeds this plan's limits</span>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={() => handleContactSales(
                                plan,
                                "downgrade",
                              )}
                              disabled={isSubmitting === plan.id}
                            >
                              {isSubmitting === plan.id
                                ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Submitting...
                                    </>
                                  )
                                : (
                                    "Contact Sales"
                                  )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="space-y-4">
          <h5 className="font-medium flex items-center gap-2">
            Resource Usage
            {hasWarnings && (
              <Badge
                variant="outline"
                className="text-warning border-warning gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Approaching limits
              </Badge>
            )}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {([
              {
                key: "vehicles" as const, label: "Vehicles", Icon: Truck,
              },
              {
                key: "users" as const, label: "Users", Icon: Users,
              },
              {
                key: "devices" as const, label: "Devices", Icon: Cpu,
              },
              {
                key: "sims" as const, label: "SIMs", Icon: Wifi,
              },
            ]).map(({
              key, label, Icon,
            }) => {
              const stat = usageStats[key];
              const atLimit = isAtLimit(key);
              const approaching = isApproachingLimit(key) && !atLimit;
              const hasLimit = stat.limit !== null && stat.limit !== undefined;
              return (
                <div
                  key={key}
                  className="p-4 rounded-lg border shadow-lg bg-transparent"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    {atLimit && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-destructive border-destructive/40 text-[10px] py-0 px-1.5"
                      >
                        Limit reached
                      </Badge>
                    )}
                    {approaching && !atLimit && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-warning border-warning/40 text-[10px] py-0 px-1.5"
                      >
                        Approaching
                      </Badge>
                    )}
                  </div>
                  {hasLimit
                    ? (
                        <Progress
                          value={stat.percentage}
                          className={cn(
                            "h-2.5 bg-secondary",
                            atLimit && "[&>div]:bg-destructive",
                            approaching && "[&>div]:bg-warning",
                            !atLimit && !approaching && "[&>div]:bg-primary",
                          )}
                        />
                      )
                    : (
                        <div className="h-2.5 rounded-full bg-secondary" />
                      )}
                  <div className="flex items-center justify-between mt-2">
                    <p className={cn(
                      "text-xs font-medium",
                      atLimit && "text-destructive",
                      approaching && "text-warning",
                      !atLimit && !approaching && "text-primary-foreground font-medium",
                    )}
                    >
                      {stat.current}
                      {" "}
                      of
                      {stat.limit ?? "∞"}
                      {" "}
                      used
                    </p>
                    {hasLimit && (
                      <p className="text-xs text-primary-foreground font-medium">
                        {Math.max(
                          0,
                          (stat.limit ?? 0) - stat.current,
                        )}
                        {" "}
                        remaining
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Usage Charts */}
        <PlanUsageCharts
          planName={currentPlan.name}
          vehicles={usageStats.vehicles}
          users={usageStats.users}
          devices={usageStats.devices}
        />

        {/* Feature Access */}
        {(includedFeatures.length > 0 || lockedFeatures.length > 0) && (
          <div className="space-y-3">
            <h5 className="font-medium">Plan Features</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {includedFeatures.slice(
                0,
                6,
              ).map(feature => (
                <div
                  key={feature.feature_key}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-success/5 border border-success/20"
                >
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  <span>{feature.feature_name}</span>
                  {feature.usage_limit && (
                    <Badge
                      variant="outline"
                      className="ml-auto text-xs"
                    >
                      {feature.usage_limit}
                      /mo
                    </Badge>
                  )}
                </div>
              ))}
              {lockedFeatures.slice(
                0,
                4,
              ).map(feature => (
                <div
                  key={feature.feature_key}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 border border-muted text-muted-foreground"
                >
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>{feature.feature_name}</span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs"
                  >
                    Upgrade
                  </Badge>
                </div>
              ))}
            </div>
            {(includedFeatures.length > 6 || lockedFeatures.length > 4) && (
              <p className="text-xs text-muted-foreground">
                +
                {Math.max(
                  0,
                  includedFeatures.length - 6,
                ) + Math.max(
                  0,
                  lockedFeatures.length - 4,
                )}
                {" "}
                more features
              </p>
            )}
          </div>
        )}

        {/* Upgrade Prompt */}
        {(hasWarnings || lockedFeatures.length > 0) && upgradeOptions.length > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {hasWarnings
                    ? "You're approaching your plan limits"
                    : "Unlock more features"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasWarnings
                    ? "Consider upgrading to avoid service interruptions when adding new resources."
                    : `Upgrade to access ${lockedFeatures.length} more features including ${lockedFeatures[0]?.feature_name}.`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setUpgradeDialogOpen(true)}
              >
                View Plans
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PlanUsageChartsProps = {
  planName: string;
  vehicles: UsageStat;
  users: UsageStat;
  devices: UsageStat;
};

// ponytail: allocation only. There is no historical-usage endpoint, so no trend
// chart — add one when the server can report usage over time.
function PlanUsageCharts({
  planName, vehicles, users, devices,
}: PlanUsageChartsProps) {
  const usageVsLimit = ([
    {
      name: "Vehicles", stat: vehicles,
    },
    {
      name: "Users", stat: users,
    },
    {
      name: "Devices", stat: devices,
    },
  ]).map(({
    name, stat,
  }) => ({
    name,
    Used: stat.current,
    Remaining: Math.max(
      0,
      (stat.limit ?? stat.current) - stat.current,
    ),
    limit: stat.limit,
  }));

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Plan Allocation</CardTitle>
          <CardDescription>
            {planName}
            {" "}
            plan — used vs remaining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={usageVsLimit}
              layout="vertical"
              margin={{
                left: 8, right: 16,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/30"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(value: number, name: string, item: any) => {
                  if (name === "Used") {
                    return [
                      `${value} / ${item.payload.limit ?? "∞"}`,
                      "Used",
                    ];
                  }
                  return [
                    value,
                    name,
                  ];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="Used"
                stackId="a"
                fill="hsl(var(--primary))"
                radius={[
                  4,
                  0,
                  0,
                  4,
                ]}
              />
              <Bar
                dataKey="Remaining"
                stackId="a"
                fill="hsl(var(--muted))"
                radius={[
                  0,
                  4,
                  4,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
