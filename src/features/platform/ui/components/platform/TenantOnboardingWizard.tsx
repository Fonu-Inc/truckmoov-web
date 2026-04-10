import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  getSystemSubscriptionPlansQueryOptions,
  getSystemTenantOnboardingReferenceDataQueryOptions,
  useCreateSystemTenant,
} from "@/features/auth/api";
import type {
  BillingCycle,
  DeviceManufacturer,
  OrganizationType,
  SimCarrier,
  SimDataPackage,
  SystemSubscriptionPlan,
  SystemTenantFeatureFlags,
  SystemTenantOnboardingReferenceData,
} from "@/features/auth/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Cpu,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Settings,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type FeatureKey = keyof SystemTenantFeatureFlags;

type OnboardingFormValues = {
  companyName: string;
  email: string;
  phoneNumber: string;
  billingEmail: string;
  businessAddress: string;
  organizationType: OrganizationType | string;
  planCode: string;
  billingCycle: BillingCycle | string;
  provisionDevices: boolean;
  numberOfDevices: number;
  deviceManufacturer: DeviceManufacturer | string;
  provisionSims: boolean;
  numberOfSims: number;
  carrier: SimCarrier | string;
  dataPackage: SimDataPackage | string;
  features: SystemTenantFeatureFlags;
};

const FEATURE_KEYS: FeatureKey[] = [
  "liveTracking",
  "messaging",
  "geofencing",
  "routeOptimization",
  "advancedAnalytics",
  "apiAccess",
];

const onboardingSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    email: z.string().email("Enter a valid email address"),
    phoneNumber: z.string(),
    billingEmail: z.union([z.string().email("Enter a valid billing email"), z.literal("")]),
    businessAddress: z.string(),
    organizationType: z.string().min(1, "Organization type is required"),
    planCode: z.string().min(1, "Plan is required"),
    billingCycle: z.string().min(1, "Billing cycle is required"),
    provisionDevices: z.boolean(),
    numberOfDevices: z.coerce.number().int().positive(),
    deviceManufacturer: z.string(),
    provisionSims: z.boolean(),
    numberOfSims: z.coerce.number().int().positive(),
    carrier: z.string(),
    dataPackage: z.string(),
    features: z.object({
      liveTracking: z.boolean(),
      messaging: z.boolean(),
      geofencing: z.boolean(),
      routeOptimization: z.boolean(),
      advancedAnalytics: z.boolean(),
      apiAccess: z.boolean(),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.provisionDevices) {
      if (!values.numberOfDevices) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["numberOfDevices"], message: "Number of devices is required" });
      }

      if (!values.deviceManufacturer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deviceManufacturer"],
          message: "Device manufacturer is required",
        });
      }
    }

    if (values.provisionSims) {
      if (!values.numberOfSims) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["numberOfSims"], message: "Number of SIMs is required" });
      }

      if (!values.carrier) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["carrier"], message: "Carrier is required" });
      }

      if (!values.dataPackage) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dataPackage"], message: "Data package is required" });
      }
    }
  });

const steps = [
  { id: 1, title: "Company Details", icon: Building2 },
  { id: 2, title: "Subscription Plan", icon: CreditCard },
  { id: 3, title: "Device Provisioning", icon: Cpu },
  { id: 4, title: "SIM Assignment", icon: Smartphone },
  { id: 5, title: "Features & Review", icon: Settings },
];

const organizationTypeMeta: Record<OrganizationType, { label: string; description: string; icon: string }> = {
  fleet_provider: {
    label: "Fleet Provider",
    description: "Operates vehicles and drivers and executes transport jobs.",
    icon: "🚛",
  },
  enterprise: {
    label: "Enterprise",
    description: "Creates jobs, contracts providers, and monitors delivery SLAs.",
    icon: "🏢",
  },
  aggregator: {
    label: "Aggregator",
    description: "Coordinates owner-operators and brokers work across fleets.",
    icon: "🔗",
  },
  owner_operator: {
    label: "Owner-Operator",
    description: "Independent operator with one or more vehicles.",
    icon: "👤",
  },
};

function isOrganizationType(value: string): value is OrganizationType {
  return value in organizationTypeMeta;
}

function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_KEYS.includes(value as FeatureKey);
}

function titleCase(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildDefaultValues(
  referenceData?: SystemTenantOnboardingReferenceData,
  subscriptionPlans: SystemSubscriptionPlan[] = []
): OnboardingFormValues {
  const featureDefaults = referenceData?.featureDefaults ?? {
    liveTracking: true,
    messaging: true,
    geofencing: false,
    routeOptimization: false,
    advancedAnalytics: false,
    apiAccess: false,
  };

  return {
    companyName: "",
    email: "",
    phoneNumber: "",
    billingEmail: "",
    businessAddress: "",
    organizationType: referenceData?.organizationTypes[0] ?? "fleet_provider",
    planCode: subscriptionPlans[0]?.code ?? "starter",
    billingCycle: referenceData?.billingCycles[0] ?? "monthly",
    provisionDevices: false,
    numberOfDevices: 10,
    deviceManufacturer: referenceData?.deviceManufacturers[0] ?? "Teltonika",
    provisionSims: false,
    numberOfSims: 10,
    carrier: referenceData?.simCarriers[0] ?? "MTN",
    dataPackage: referenceData?.simDataPackages[0] ?? "500MB/month",
    features: featureDefaults,
  };
}

function getPlanLabel(planCode: string, plans: SystemSubscriptionPlan[]) {
  return plans.find((plan) => plan.code === planCode)?.name ?? titleCase(planCode);
}

function formatNairaAmount(value: number | null) {
  if (value == null) return "Contact sales";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSelectedPlan(plans: SystemSubscriptionPlan[], planCode: string) {
  return plans.find((plan) => plan.code === planCode) ?? null;
}

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const referenceDataQuery = useQuery({
    ...getSystemTenantOnboardingReferenceDataQueryOptions(),
    enabled: open,
  });
  const subscriptionPlansQuery = useQuery({
    ...getSystemSubscriptionPlansQueryOptions(),
    enabled: open,
  });
  const createTenantMutation = useCreateSystemTenant();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: buildDefaultValues(),
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const referenceData = referenceDataQuery.data?.data;
  const subscriptionPlans = subscriptionPlansQuery.data?.data.plans ?? [];
  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      reset(buildDefaultValues());
      return;
    }

    if (!referenceData || subscriptionPlansQuery.isLoading) return;

    reset(buildDefaultValues(referenceData, subscriptionPlans));
  }, [open, referenceData, reset, subscriptionPlans, subscriptionPlansQuery.isLoading]);

  const currentBillingCycle = watch("billingCycle");
  const selectedPlanCode = watch("planCode");
  const selectedPlan = getSelectedPlan(subscriptionPlans, selectedPlanCode);
  const selectedMonthlyPrice = selectedPlan?.monthlyPriceNgn ?? null;
  const selectedYearlyPrice = selectedPlan?.yearlyMonthlyEquivalentNgn ?? null;
  const provisionDevices = watch("provisionDevices");
  const provisionSims = watch("provisionSims");
  const selectedOrganizationType = watch("organizationType");
  const selectedFeatures = watch("features");

  const validateCurrentStep = async () => {
    if (currentStep === 1) {
      return trigger(["companyName", "email", "billingEmail", "organizationType"]);
    }

    if (currentStep === 2) {
      return trigger(["planCode", "billingCycle"]);
    }

    if (currentStep === 3) {
      return provisionDevices ? trigger(["numberOfDevices", "deviceManufacturer"]) : true;
    }

    if (currentStep === 4) {
      return provisionSims ? trigger(["numberOfSims", "carrier", "dataPackage"]) : true;
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error("Please complete the required fields for this step.");
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await createTenantMutation.mutateAsync({
      data: {
        company: {
          companyName: values.companyName,
          email: values.email,
          phoneNumber: values.phoneNumber || undefined,
          billingEmail: values.billingEmail || undefined,
          businessAddress: values.businessAddress || undefined,
          organizationType: values.organizationType as OrganizationType,
        },
        subscription: {
          planCode: values.planCode,
          billingCycle: values.billingCycle as BillingCycle,
        },
        deviceProvisioning: values.provisionDevices
          ? {
              provisionNow: true,
              numberOfDevices: values.numberOfDevices,
              deviceManufacturer: values.deviceManufacturer as DeviceManufacturer,
            }
          : { provisionNow: false },
        simAssignment: values.provisionSims
          ? {
              provisionNow: true,
              numberOfSims: values.numberOfSims,
              carrier: values.carrier as SimCarrier,
              dataPackage: values.dataPackage as SimDataPackage,
            }
          : { provisionNow: false },
        features: values.features,
      },
    });

    onComplete();
    onOpenChange(false);
    setCurrentStep(1);
    if (referenceData) {
      reset(buildDefaultValues(referenceData, subscriptionPlans));
    }
  });

  const isLoading = referenceDataQuery.isLoading || subscriptionPlansQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            New Tenant Onboarding
          </DialogTitle>
          <DialogDescription>Complete the setup wizard to create a new tenant organization.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading onboarding reference data...</div>
        ) : !referenceData ? (
          <div className="py-8 text-sm text-muted-foreground">Onboarding reference data is unavailable.</div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
            {/* stepper */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex flex-wrap justify-between gap-2">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-1 text-xs ${
                        isActive
                          ? "font-medium text-primary"
                          : isCompleted
                            ? "text-success"
                            : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                              ? "bg-success text-success-foreground"
                              : "bg-muted"
                        }`}
                      >
                        {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                      </div>
                      <Icon className="hidden h-3.5 w-3.5 md:inline" />
                      <span className="hidden md:inline">{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="companyName"
                          className="pl-10"
                          placeholder="ABC Logistics Ltd"
                          {...register("companyName")}
                        />
                      </div>
                      {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10"
                          placeholder="admin@company.com"
                          {...register("email")}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phoneNumber"
                          className="pl-10"
                          placeholder="+234 801 234 5678"
                          {...register("phoneNumber")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingEmail">Billing Email</Label>
                      <div className="relative">
                        <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="billingEmail"
                          type="email"
                          className="pl-10"
                          placeholder="billing@company.com"
                          {...register("billingEmail")}
                        />
                      </div>
                      {errors.billingEmail && <p className="text-xs text-destructive">{errors.billingEmail.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="businessAddress"
                        className="pl-10"
                        placeholder="123 Business District, Lagos"
                        {...register("businessAddress")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Organization Type *</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {referenceData.organizationTypes.map((organizationType) => {
                        const meta = isOrganizationType(organizationType)
                          ? organizationTypeMeta[organizationType]
                          : {
                              label: titleCase(organizationType),
                              description: "Backend provided organization type.",
                              icon: "Type",
                            };

                        return (
                          <Card
                            key={organizationType}
                            className={`cursor-pointer transition-all hover:border-primary/50 ${
                              selectedOrganizationType === organizationType ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                            onClick={() => setValue("organizationType", organizationType, { shouldValidate: true })}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-lg">{meta.icon}</span>
                                <div>
                                  <p className="font-medium text-sm">{meta.label}</p>
                                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {errors.organizationType && <p className="text-xs text-destructive">{errors.organizationType.message}</p>}
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Plan</CardTitle>
                      <CardDescription>Choose the plan and billing cycle for this tenant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Billing Cycle *</Label>
                        <div className="inline-flex rounded-lg border bg-muted p-1">
                          {referenceData.billingCycles.map((billingCycle) => {
                            const isActive = currentBillingCycle === billingCycle;
                            return (
                              <Button
                                key={billingCycle}
                                type="button"
                                variant={isActive ? "default" : "ghost"}
                                size="sm"
                                className="h-8"
                                onClick={() => setValue("billingCycle", billingCycle, { shouldValidate: true })}
                              >
                                {titleCase(billingCycle)}
                              </Button>
                            );
                          })}
                        </div>
                        {errors.billingCycle && <p className="text-xs text-destructive">{errors.billingCycle.message}</p>}
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-3">
                          <Label>Plan *</Label>
                          <div className="grid gap-3">
                            {subscriptionPlans.map((plan) => {
                              const isSelected = selectedPlanCode === plan.code;
                              return (
                                <Card
                                  key={plan.code}
                                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                                      isSelected ? "border-primary ring-2 ring-primary/20" : ""
                                    }`}
                                    onClick={() => setValue("planCode", plan.code, { shouldValidate: true })}
                                >
                                  <CardContent className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold">{plan.name}</p>
                                          {plan.badge ? <Badge variant="secondary">{plan.badge}</Badge> : null}
                                          {plan.customPricing ? <Badge variant="outline">Custom pricing</Badge> : null}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                                      </div>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                      <div className="rounded-md bg-muted/40 p-3">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly</p>
                                        <p className="mt-1 text-sm font-medium">{formatNairaAmount(plan.monthlyPriceNgn)}</p>
                                      </div>
                                      <div className="rounded-md bg-muted/40 p-3">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Yearly</p>
                                        <p className="mt-1 text-sm font-medium">{formatNairaAmount(plan.yearlyMonthlyEquivalentNgn)}</p>
                                        {plan.yearlyDiscountPercent != null ? (
                                          <p className="text-xs text-muted-foreground">{plan.yearlyDiscountPercent}% discount</p>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                                      <div className="rounded-md bg-muted/40 p-3">
                                        <p className="font-medium text-foreground">Includes</p>
                                        <p className="mt-1">
                                          {plan.features.slice(0, 3).join(", ")}
                                          {plan.features.length > 3 ? "..." : ""}
                                        </p>
                                      </div>
                                      <div className="rounded-md bg-muted/40 p-3">
                                        <p className="font-medium text-foreground">Capacity</p>
                                        <p className="mt-1">
                                          {plan.maxActiveVehicles != null
                                            ? `Up to ${plan.maxActiveVehicles} active vehicles`
                                            : "Unlimited vehicle capacity"}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                          {errors.planCode && <p className="text-xs text-destructive">{errors.planCode.message}</p>}
                        </div>

                        <Card className="h-fit">
                          <CardHeader>
                            <CardTitle className="text-base">Plan Details</CardTitle>
                            <CardDescription>What this tenant gets with the selected plan.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{selectedPlan?.name ?? getPlanLabel(selectedPlanCode, subscriptionPlans)}</p>
                                {selectedPlan?.badge ? <Badge variant="secondary">{selectedPlan.badge}</Badge> : null}
                              </div>
                              <p className="text-sm text-muted-foreground">{selectedPlan?.description ?? "Select a plan to see details."}</p>
                            </div>

                            <div className="grid gap-3">
                              <div className="rounded-lg border p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly</p>
                                <p className="mt-1 font-medium">
                                  {formatNairaAmount(selectedMonthlyPrice)}
                                  <span className="ml-1 text-sm text-muted-foreground">/ month</span>
                                </p>
                              </div>

                              <div className="rounded-lg border p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Yearly</p>
                                <p className="mt-1 font-medium">
                                  {formatNairaAmount(selectedYearlyPrice)}
                                  <span className="ml-1 text-sm text-muted-foreground">/ month billed yearly</span>
                                </p>
                                {selectedPlan?.yearlyDiscountPercent != null ? (
                                  <p className="text-xs text-muted-foreground">
                                    {selectedPlan.yearlyDiscountPercent}% yearly discount applied.
                                  </p>
                                ) : null}
                              </div>

                              <div className="rounded-lg border p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trial</p>
                                <p className="mt-1 font-medium">
                                  {selectedPlan?.trialDays ? `${selectedPlan.trialDays} day trial` : "No trial"}
                                </p>
                              </div>

                              <div className="rounded-lg border p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</p>
                                <p className="mt-1 font-medium">
                                  {selectedPlan?.maxActiveVehicles != null
                                    ? `${selectedPlan.maxActiveVehicles} active vehicles`
                                    : "Unlimited active vehicles"}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-sm font-medium">Included features</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(selectedPlan?.features ?? []).length > 0 ? (
                                  selectedPlan!.features.map((feature) => (
                                    <Badge key={feature} variant="outline">
                                      {feature}
                                    </Badge>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">No feature list provided for this plan.</p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-sm font-medium">Plan action</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedPlan?.ctaLabel ? `CTA: ${selectedPlan.ctaLabel}` : "Select this plan to continue."}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">Selected plan</p>
                            <p className="text-sm text-muted-foreground">{getPlanLabel(selectedPlanCode, subscriptionPlans)}</p>
                          </div>
                          <Badge className="border-primary/30 bg-primary/10 text-primary">
                            {titleCase(String(currentBillingCycle))}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle>IoT Device Setup</CardTitle>
                            <CardDescription>Optional device provisioning during tenant creation.</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label htmlFor="provisionDevices" className="text-sm text-muted-foreground">
                            Provision devices now
                          </Label>
                          <Controller
                            control={control}
                            name="provisionDevices"
                            render={({ field }) => (
                              <Switch id="provisionDevices" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!provisionDevices ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
                          <Cpu className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                          <p className="font-medium text-muted-foreground">Device provisioning skipped</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            The tenant can add devices later from the devices page.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="numberOfDevices">Number of Devices</Label>
                              <Input
                                id="numberOfDevices"
                                type="number"
                                min={1}
                                {...register("numberOfDevices", { valueAsNumber: true })}
                              />
                              {errors.numberOfDevices && (
                                <p className="text-xs text-destructive">{errors.numberOfDevices.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Device Manufacturer</Label>
                              <Controller
                                control={control}
                                name="deviceManufacturer"
                                render={({ field }) => (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select manufacturer" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover">
                                      {referenceData.deviceManufacturers.map((manufacturer) => (
                                        <SelectItem key={manufacturer} value={manufacturer}>
                                          {manufacturer}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {errors.deviceManufacturer && (
                                <p className="text-xs text-destructive">{errors.deviceManufacturer.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="rounded-lg bg-muted/50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium">Device Summary</p>
                                <p className="text-sm text-muted-foreground">
                                  {watch("numberOfDevices")} x {watch("deviceManufacturer")} GPS trackers
                                </p>
                              </div>
                              <Badge variant="outline">
                                <Truck className="mr-1 h-3 w-3" />
                                {watch("numberOfDevices")} Units
                              </Badge>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle>SIM Card Configuration</CardTitle>
                            <CardDescription>Optional SIM assignment and data package selection.</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label htmlFor="provisionSims" className="text-sm text-muted-foreground">
                            Provision SIMs now
                          </Label>
                          <Controller
                            control={control}
                            name="provisionSims"
                            render={({ field }) => (
                              <Switch id="provisionSims" checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!provisionSims ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
                          <Smartphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                          <p className="font-medium text-muted-foreground">SIM provisioning skipped</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            SIM cards can be assigned later when the tenant requests them.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label htmlFor="numberOfSims">Number of SIMs</Label>
                              <Input
                                id="numberOfSims"
                                type="number"
                                min={1}
                                {...register("numberOfSims", { valueAsNumber: true })}
                              />
                              {errors.numberOfSims && <p className="text-xs text-destructive">{errors.numberOfSims.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Carrier</Label>
                              <Controller
                                control={control}
                                name="carrier"
                                render={({ field }) => (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select carrier" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover">
                                      {referenceData.simCarriers.map((carrier) => (
                                        <SelectItem key={carrier} value={carrier}>
                                          {carrier}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {errors.carrier && <p className="text-xs text-destructive">{errors.carrier.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Data Package</Label>
                              <Controller
                                control={control}
                                name="dataPackage"
                                render={({ field }) => (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select data package" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover">
                                      {referenceData.simDataPackages.map((dataPackage) => (
                                        <SelectItem key={dataPackage} value={dataPackage}>
                                          {dataPackage}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {errors.dataPackage && (
                                <p className="text-xs text-destructive">{errors.dataPackage.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="rounded-lg bg-muted/50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium">SIM Summary</p>
                                <p className="text-sm text-muted-foreground">
                                  {watch("numberOfSims")} x {watch("carrier")} SIM with {watch("dataPackage")} data
                                </p>
                              </div>
                              <Badge variant="outline">
                                <Smartphone className="mr-1 h-3 w-3" />
                                {watch("numberOfSims")} SIMs
                              </Badge>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Enable Features</CardTitle>
                      <CardDescription>Enable backend-supported platform capabilities for this tenant.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      {referenceData.featureOptions.map((feature) => {
                        if (!isFeatureKey(feature.key)) return null;

                        return (
                          <div key={feature.key} className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <p className="font-medium">{feature.label}</p>
                              <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                            <Controller
                              control={control}
                              name={`features.${feature.key}` as const}
                              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Review Summary</CardTitle>
                      <CardDescription>Confirm the tenant details before creating the account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 text-sm md:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Company</p>
                          <p className="font-medium">{watch("companyName") || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{watch("email") || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Plan</p>
                          <Badge className="bg-primary/10 text-primary">{getPlanLabel(selectedPlanCode, subscriptionPlans)}</Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Billing</p>
                          <p className="font-medium">{titleCase(String(currentBillingCycle))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Devices</p>
                          <p className="font-medium">
                            {provisionDevices ? (
                              `${watch("numberOfDevices")} units (${watch("deviceManufacturer")})`
                            ) : (
                              <span className="italic text-muted-foreground">Self-managed by tenant</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">SIM Cards</p>
                          <p className="font-medium">
                            {provisionSims ? (
                              `${watch("numberOfSims")} SIMs (${watch("carrier")})`
                            ) : (
                              <span className="italic text-muted-foreground">On-demand via requests</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm font-medium">Enabled Features</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {FEATURE_KEYS.filter((featureKey) => selectedFeatures[featureKey]).map((featureKey) => {
                            const feature = referenceData.featureOptions.find((option) => option.key === featureKey);
                            return (
                              <Badge key={featureKey} variant="outline">
                                {feature?.label ?? titleCase(featureKey)}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={createTenantMutation.isPending}>
                  {createTenantMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Tenant...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TenantOnboardingWizard;
