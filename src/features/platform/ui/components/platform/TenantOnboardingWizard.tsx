import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  getSystemTenantOnboardingReferenceDataQueryOptions,
  useCreateSystemTenant,
} from "@/features/auth/api";
import type {
  BillingCycle,
  DeviceManufacturer,
  OrganizationType,
  SimCarrier,
  SimDataPackage,
  SystemTenantFeatureFlags,
} from "@/features/auth/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type FeatureKey = keyof SystemTenantFeatureFlags;

const onboardingSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    email: z.string().email("Enter a valid email address"),
    phoneNumber: z.string().optional(),
    billingEmail: z.union([z.string().email("Enter a valid billing email"), z.literal("")]).optional(),
    businessAddress: z.string().optional(),
    organizationType: z.string().min(1, "Organization type is required"),
    planCode: z.string().min(1, "Plan is required"),
    billingCycle: z.string().min(1, "Billing cycle is required"),
    provisionDevices: z.boolean(),
    numberOfDevices: z.coerce.number().int().positive().optional(),
    deviceManufacturer: z.string().optional(),
    provisionSims: z.boolean(),
    numberOfSims: z.coerce.number().int().positive().optional(),
    carrier: z.string().optional(),
    dataPackage: z.string().optional(),
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
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numberOfDevices"],
          message: "Number of devices is required",
        });
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
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numberOfSims"],
          message: "Number of SIMs is required",
        });
      }
      if (!values.carrier) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["carrier"],
          message: "Carrier is required",
        });
      }
      if (!values.dataPackage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dataPackage"],
          message: "Data package is required",
        });
      }
    }
  });

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

function buildDefaultValues(
  organizationTypes: OrganizationType[] = [],
  billingCycles: BillingCycle[] = [],
  tenantPlans: string[] = [],
  deviceManufacturers: DeviceManufacturer[] = [],
  simCarriers: SimCarrier[] = [],
  simDataPackages: SimDataPackage[] = [],
  featureDefaults?: SystemTenantFeatureFlags
): OnboardingFormValues {
  return {
    companyName: "",
    email: "",
    phoneNumber: "",
    billingEmail: "",
    businessAddress: "",
    organizationType: organizationTypes[0] ?? "fleet_provider",
    planCode: tenantPlans[0] ?? "starter",
    billingCycle: billingCycles[0] ?? "monthly",
    provisionDevices: false,
    numberOfDevices: 10,
    deviceManufacturer: deviceManufacturers[0] ?? "Teltonika",
    provisionSims: false,
    numberOfSims: 10,
    carrier: simCarriers[0] ?? "MTN",
    dataPackage: simDataPackages[0] ?? "500MB/month",
    features: featureDefaults ?? {
      liveTracking: true,
      messaging: true,
      geofencing: false,
      routeOptimization: false,
      advancedAnalytics: false,
      apiAccess: false,
    },
  };
}

function getOrganizationTypeLabel(value: OrganizationType) {
  switch (value) {
    case "fleet_provider":
      return "Fleet Provider";
    case "enterprise":
      return "Enterprise";
    case "aggregator":
      return "Aggregator";
    case "owner_operator":
      return "Owner-Operator";
    default:
      return value;
  }
}

function getPlanLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFeatureKey(key: string): FeatureKey | null {
  const featureKeys: FeatureKey[] = [
    "liveTracking",
    "messaging",
    "geofencing",
    "routeOptimization",
    "advancedAnalytics",
    "apiAccess",
  ];
  return featureKeys.includes(key as FeatureKey) ? (key as FeatureKey) : null;
}

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const referenceDataQuery = useQuery({
    ...getSystemTenantOnboardingReferenceDataQueryOptions(),
    enabled: open,
  });
  const createTenantMutation = useCreateSystemTenant();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: buildDefaultValues(),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open || !referenceDataQuery.data?.data) return;

    const referenceData = referenceDataQuery.data.data;
    reset(
      buildDefaultValues(
        referenceData.organizationTypes,
        referenceData.billingCycles,
        referenceData.tenantPlans,
        referenceData.deviceManufacturers,
        referenceData.simCarriers,
        referenceData.simDataPackages,
        referenceData.featureDefaults
      )
    );
  }, [open, referenceDataQuery.data, reset]);

  const provisionDevices = watch("provisionDevices");
  const provisionSims = watch("provisionSims");
  const selectedPlanCode = watch("planCode");

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

    onOpenChange(false);
    onComplete();
    if (referenceDataQuery.data?.data) {
      const referenceData = referenceDataQuery.data.data;
      reset(
        buildDefaultValues(
          referenceData.organizationTypes,
          referenceData.billingCycles,
          referenceData.tenantPlans,
          referenceData.deviceManufacturers,
          referenceData.simCarriers,
          referenceData.simDataPackages,
          referenceData.featureDefaults
        )
      );
    }
  });

  const referenceData = referenceDataQuery.data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Onboard Tenant
          </DialogTitle>
          <DialogDescription>
            Create a new tenant using backend-backed onboarding fields and defaults.
          </DialogDescription>
        </DialogHeader>

        {referenceDataQuery.isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading onboarding reference data...</div>
        ) : !referenceData ? (
          <div className="py-8 text-sm text-muted-foreground">Onboarding reference data is unavailable.</div>
        ) : (
          <form className="space-y-6" onSubmit={onSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Basic tenant and billing contact information.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" {...register("companyName")} />
                  {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" {...register("phoneNumber")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input id="billingEmail" type="email" {...register("billingEmail")} />
                  {errors.billingEmail && <p className="text-xs text-destructive">{errors.billingEmail.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input id="businessAddress" {...register("businessAddress")} />
                </div>
                <div className="space-y-2">
                  <Label>Organization Type</Label>
                  <Controller
                    control={control}
                    name="organizationType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          {referenceData.organizationTypes.map((organizationType) => (
                            <SelectItem key={organizationType} value={organizationType}>
                              {getOrganizationTypeLabel(organizationType)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.organizationType && <p className="text-xs text-destructive">{errors.organizationType.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Plan and billing cycle for this tenant.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Controller
                    control={control}
                    name="planCode"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {referenceData.tenantPlans.map((planCode) => (
                            <SelectItem key={planCode} value={planCode}>
                              {getPlanLabel(planCode)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.planCode && <p className="text-xs text-destructive">{errors.planCode.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Controller
                    control={control}
                    name="billingCycle"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          {referenceData.billingCycles.map((billingCycle) => (
                            <SelectItem key={billingCycle} value={billingCycle}>
                              {getPlanLabel(billingCycle)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.billingCycle && <p className="text-xs text-destructive">{errors.billingCycle.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    Selected plan: {getPlanLabel(selectedPlanCode)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provisioning</CardTitle>
                <CardDescription>Optional device and SIM assignment for the new tenant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Provision devices now</p>
                      <p className="text-sm text-muted-foreground">Assign device inventory during onboarding.</p>
                    </div>
                    <Controller
                      control={control}
                      name="provisionDevices"
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                  {provisionDevices && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="numberOfDevices">Number of Devices</Label>
                        <Input id="numberOfDevices" type="number" min={1} {...register("numberOfDevices")} />
                        {errors.numberOfDevices && <p className="text-xs text-destructive">{errors.numberOfDevices.message}</p>}
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
                              <SelectContent>
                                {referenceData.deviceManufacturers.map((manufacturer) => (
                                  <SelectItem key={manufacturer} value={manufacturer}>
                                    {manufacturer}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.deviceManufacturer && <p className="text-xs text-destructive">{errors.deviceManufacturer.message}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Provision SIMs now</p>
                      <p className="text-sm text-muted-foreground">Assign SIMs and data packages during onboarding.</p>
                    </div>
                    <Controller
                      control={control}
                      name="provisionSims"
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                  {provisionSims && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="numberOfSims">Number of SIMs</Label>
                        <Input id="numberOfSims" type="number" min={1} {...register("numberOfSims")} />
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
                              <SelectContent>
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
                              <SelectContent>
                                {referenceData.simDataPackages.map((dataPackage) => (
                                  <SelectItem key={dataPackage} value={dataPackage}>
                                    {dataPackage}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.dataPackage && <p className="text-xs text-destructive">{errors.dataPackage.message}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>Enable backend-supported platform capabilities for this tenant.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {referenceData.featureOptions.map((feature) => {
                  const featureKey = getFeatureKey(feature.key);
                  if (!featureKey) return null;

                  return (
                    <div key={feature.key} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{feature.label}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Controller
                        control={control}
                        name={`features.${featureKey}`}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createTenantMutation.isPending}>
                Create Tenant
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TenantOnboardingWizard;
