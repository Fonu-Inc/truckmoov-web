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
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine,
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
import { useAuthStore } from "@/stores/authStore";

type TenantPlan = any;

// Dummy fallback plan used when no real subscription is found yet.
// This lets users preview what their chosen plan would look like
// inside Organisation Settings → Subscription.
const DEMO_PLAN: TenantPlan = {
  id: "demo-professional",
  name: "Professional",
  tier: "Standard",
  price_ngn: 150_000,
  billing_cycle: "monthly",
  max_vehicles: 100,
  max_drivers: 120,
  max_devices: 100,
  storage_gb: 50,
  features: [
    "Full fleet management",
    "AI load matching",
    "WhatsApp + SMS messaging",
    "Priority support",
  ],
  is_popular: true,
  trial_days: 14,
  yearly_discount_percent: 10,
  tier_badge_color: "hsl(var(--primary))",
};

export function TenantSubscriptionCard() {
  const tenant = null;
  const realCurrentPlan: TenantPlan | null = null;
  const planFeatures: any[] = [];
  const usageStats = {
    vehicles: {
      current: 0, limit: null as number | null, percentage: 0,
    },
    drivers: {
      current: 0, limit: null as number | null, percentage: 0,
    },
    devices: {
      current: 0, limit: null as number | null, percentage: 0,
    },
    sims: {
      current: 0, limit: null as number | null, percentage: 0,
    },
  };
  const upgradeOptions: TenantPlan[] = [];
  const downgradeOptions: TenantPlan[] = [];
  const isLoading = false;
  const isApproachingLimit = (_key: string) => false;
  const isAtLimit = (_key: string) => false;
  const currentPlan = realCurrentPlan ?? DEMO_PLAN;
  const { user } = useAuthStore();
  const { currency } = useCurrency();
  const [
    upgradeDialogOpen,
    setUpgradeDialogOpen,
  ] = useState(false);
  const [
    downgradeDialogOpen,
    setDowngradeDialogOpen,
  ] = useState(false);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState<string | null>(null);

  const handleContactSales = async (_plan: TenantPlan, _action: "upgrade" | "downgrade") => {
    toast.info("Coming soon");
  };

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

  // currentPlan always defined — falls back to DEMO_PLAN above when none is set.

  const includedFeatures = planFeatures?.filter(f => f.is_included) || [];
  const lockedFeatures = planFeatures?.filter(f => !f.is_included) || [];
  const hasWarnings = isApproachingLimit("vehicles") || isApproachingLimit("drivers") || isApproachingLimit("devices") || isApproachingLimit("sims");

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
                <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
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
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  Billing:
                  {" "}
                  {(tenant as { billing_model?: string } | null)?.billing_model
                    ? String((tenant as { billing_model?: string }).billing_model).replace(
                        /_/g,
                        " ",
                      )
                    : "Subscription"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {currentPlan.max_vehicles ? `Up to ${currentPlan.max_vehicles} vehicles` : "Unlimited vehicles"}
                {currentPlan.max_drivers ? `, ${currentPlan.max_drivers} drivers` : ", unlimited drivers"}
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
              {currency === "NGN"
                ? `₦${currentPlan.price_ngn.toLocaleString()}`
                : `$${Math.round(currentPlan.price_ngn / 1550).toLocaleString()}`}
              <span className="text-sm font-normal text-muted-foreground">
                /
                {currentPlan.billing_cycle}
              </span>
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
                                {currency === "NGN"
                                  ? `₦${plan.price_ngn.toLocaleString()}`
                                  : `$${Math.round(plan.price_ngn / 1550).toLocaleString()}`}
                              </span>
                              <span className="text-muted-foreground">
                                /
                                {plan.billing_cycle}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm space-y-1">
                              <p>
                                •
                                {plan.max_vehicles || "Unlimited"}
                                {" "}
                                vehicles
                              </p>
                              <p>
                                •
                                {plan.max_drivers || "Unlimited"}
                                {" "}
                                drivers
                              </p>
                              <p>
                                •
                                {plan.max_devices || "Unlimited"}
                                {" "}
                                devices
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
                                {currency === "NGN"
                                  ? `₦${plan.price_ngn.toLocaleString()}`
                                  : `$${Math.round(plan.price_ngn / 1550).toLocaleString()}`}
                              </span>
                              <span className="text-muted-foreground">
                                /
                                {plan.billing_cycle}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm space-y-1 text-muted-foreground">
                              <p>
                                •
                                {plan.max_vehicles || "Unlimited"}
                                {" "}
                                vehicles
                              </p>
                              <p>
                                •
                                {plan.max_drivers || "Unlimited"}
                                {" "}
                                drivers
                              </p>
                              <p>
                                •
                                {plan.max_devices || "Unlimited"}
                                {" "}
                                devices
                              </p>
                            </div>
                            {/* Warning if current usage exceeds plan limits */}
                            {((plan.max_vehicles && usageStats.vehicles.current > plan.max_vehicles)
                              || (plan.max_drivers && usageStats.drivers.current > plan.max_drivers)
                              || (plan.max_devices && usageStats.devices.current > plan.max_devices)) && (
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
                key: "drivers" as const, label: "Drivers", Icon: Users,
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
          vehicles={{
            used: usageStats.vehicles.current, limit: usageStats.vehicles.limit,
          }}
          drivers={{
            used: usageStats.drivers.current, limit: usageStats.drivers.limit,
          }}
          devices={{
            used: usageStats.devices.current, limit: usageStats.devices.limit,
          }}
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

// Stable pseudo-random for demo trend
function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

type PlanUsageChartsProps = {
  planName: string;
  vehicles: {
    used: number; limit: number | null;
  };
  drivers: {
    used: number; limit: number | null;
  };
  devices: {
    used: number; limit: number | null;
  };
};

function PlanUsageCharts({
  planName, vehicles, drivers, devices,
}: PlanUsageChartsProps) {
  const usageVsLimit = [
    {
      name: "Vehicles",
      Used: vehicles.used,
      Remaining: Math.max(
        0,
        (vehicles.limit ?? vehicles.used) - vehicles.used,
      ),
      limit: vehicles.limit,
    },
    {
      name: "Drivers",
      Used: drivers.used,
      Remaining: Math.max(
        0,
        (drivers.limit ?? drivers.used) - drivers.used,
      ),
      limit: drivers.limit,
    },
    {
      name: "Devices",
      Used: devices.used,
      Remaining: Math.max(
        0,
        (devices.limit ?? devices.used) - devices.used,
      ),
      limit: devices.limit,
    },
  ];

  const trendData = Array.from({ length: 14 }).map((_, i) => {
    const dayIdx = i + 1;
    const progress = dayIdx / 14;
    const noise = (s: number) => 1 + (rand(s + dayIdx) - 0.5) * 0.08;
    const date = new Date();
    date.setDate(date.getDate() - (14 - dayIdx));
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      Vehicles: Math.max(
        0,
        Math.round(vehicles.used * progress * noise(1)),
      ),
      Drivers: Math.max(
        0,
        Math.round(drivers.used * progress * noise(2)),
      ),
      Devices: Math.max(
        0,
        Math.round(devices.used * progress * noise(3)),
      ),
    };
  });

  const planLimitLine = vehicles.limit ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Last 14 Days Usage</CardTitle>
          <CardDescription>
            Resource growth toward your
            {planName}
            {" "}
            plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <LineChart data={trendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/30"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {planLimitLine && (
                <ReferenceLine
                  y={planLimitLine}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="4 4"
                  label={{
                    value: `Vehicle limit (${planLimitLine})`, fontSize: 10, fill: "hsl(var(--warning))", position: "insideTopRight",
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="Vehicles"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Drivers"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Devices"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
