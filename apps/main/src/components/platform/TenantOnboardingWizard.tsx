import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  Send,
  Smartphone,
  Sparkles,
  Truck as TruckIcon, User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
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
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Progress } from "@/components/shadcn/progress";

import { Separator } from "@/components/shadcn/separator";
import { Slider } from "@/components/shadcn/slider";

type TenantOnboardingWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (tenantData: TenantFormData) => void;
};

type OrgType = "FLEET_PROVIDER" | "ENTERPRISE" | "AGGREGATOR" | "OWNER_OPERATOR";

type TenantFormData = {
  // Step 1: Company Details
  companyName: string;
  primaryContactName: string;
  email: string;
  phone: string;
  address: string;
  billingEmail: string;
  organizationType: OrgType;
  // Step 2: Subscription Plan & Quotas
  billingModel: "SUBSCRIPTION" | "TRIAL";
  plan: string;
  billingMode: "PREPAID" | "POSTPAID";
  billingCycle: "MONTHLY" | "YEARLY";
  vehicleQuota: number;
  driverQuota: number;
  deviceQuota: number;
  simQuota: number;
  jobQuota: number;
  quotaOverride: boolean;
  // Trial config (only used when billingModel === "TRIAL")
  trialDays: number;
  trialVehicleCap: number;
  trialSimCap: number;
  trialWhatsappDailyCap: number;
  trialSmsDailyCap: number;
  // Step 3: Device Provisioning (Optional)
  provisionDevices: boolean;
  deviceCount: number;
  deviceManufacturer: string;
  // Step 4: SIM Assignment (Optional)
  provisionSims: boolean;
  simCount: number;
  simCarrier: string;
  dataPackage: string;
  // Step 5: Features
  features: {
    liveTracking: boolean;
    geofencing: boolean;
    routeOptimization: boolean;
    messaging: boolean;
    analytics: boolean;
    apiAccess: boolean;
  };
};

const initialFormData: TenantFormData = {
  companyName: "",
  primaryContactName: "",
  email: "",
  phone: "",
  address: "",
  billingEmail: "",
  organizationType: "FLEET_PROVIDER",
  billingModel: "SUBSCRIPTION",
  plan: "",
  billingMode: "PREPAID",
  billingCycle: "MONTHLY",
  vehicleQuota: 25,
  driverQuota: 30,
  deviceQuota: 25,
  simQuota: 25,
  jobQuota: 500,
  quotaOverride: false,
  trialDays: 30,
  trialVehicleCap: 5,
  trialSimCap: 5,
  trialWhatsappDailyCap: 100,
  trialSmsDailyCap: 50,
  provisionDevices: false,
  deviceCount: 10,
  deviceManufacturer: "teltonika",
  provisionSims: false,
  simCount: 10,
  simCarrier: "mtn",
  dataPackage: "500mb",
  features: {
    liveTracking: true,
    geofencing: false,
    routeOptimization: false,
    messaging: true,
    analytics: false,
    apiAccess: false,
  },
};

const orgTypeOptions: {
  value: OrgType; label: string; description: string; icon: string;
}[] = [
  {
    value: "FLEET_PROVIDER", label: "Fleet Provider", description: "Operates vehicles & drivers, executes transport jobs", icon: "🚛",
  },
  {
    value: "ENTERPRISE", label: "Enterprise (Cargo Owner)", description: "Creates jobs, contracts providers, monitors SLAs", icon: "🏢",
  },
  {
    value: "AGGREGATOR", label: "Aggregator", description: "Coordinates owner-operators, brokers work across fleets", icon: "🔗",
  },
  {
    value: "OWNER_OPERATOR", label: "Owner-Operator", description: "Independent operator with own vehicle(s)", icon: "👤",
  },
];

const steps = [
  {
    id: 1, title: "Organization & Details", icon: Building2,
  },
  {
    id: 2, title: "Review", icon: Check,
  },
  {
    id: 3, title: "Confirmation", icon: CheckCircle2,
  },
];

/** Label for the primary "name" field, per stakeholder. */
const NAME_LABEL: Record<OrgType, string> = {
  ENTERPRISE: "Organization Name",
  FLEET_PROVIDER: "Company Name",
  AGGREGATOR: "Aggregator Name",
  OWNER_OPERATOR: "Company Name",
};

// Vehicle scale per stakeholder (from MVP doc)
const VEHICLE_SCALE: Record<OrgType, {
  min: number; max: number; default: number;
}> = {
  ENTERPRISE: {
    min: 100, max: 10_000, default: 100,
  },
  FLEET_PROVIDER: {
    min: 20, max: 500, default: 25,
  },
  AGGREGATOR: {
    min: 20, max: 500, default: 25,
  },
  OWNER_OPERATOR: {
    min: 1, max: 7, default: 5,
  },
};

// Operational quotas (drivers, devices, sims) scale per stakeholder.
// Drivers track ~1.2× vehicles; devices & sims roughly 1:1 with vehicles.
const DRIVER_SCALE: Record<OrgType, {
  min: number; max: number; default: number;
}> = {
  ENTERPRISE: {
    min: 100, max: 12_000, default: 120,
  },
  FLEET_PROVIDER: {
    min: 20, max: 600, default: 30,
  },
  AGGREGATOR: {
    min: 20, max: 600, default: 30,
  },
  OWNER_OPERATOR: {
    min: 1, max: 10, default: 5,
  },
};

const DEVICE_SCALE: Record<OrgType, {
  min: number; max: number; default: number;
}> = {
  ENTERPRISE: {
    min: 100, max: 10_000, default: 100,
  },
  FLEET_PROVIDER: {
    min: 20, max: 500, default: 25,
  },
  AGGREGATOR: {
    min: 20, max: 500, default: 25,
  },
  OWNER_OPERATOR: {
    min: 1, max: 10, default: 5,
  },
};

const SIM_SCALE: Record<OrgType, {
  min: number; max: number; default: number;
}> = {
  ENTERPRISE: {
    min: 100, max: 10_000, default: 100,
  },
  FLEET_PROVIDER: {
    min: 20, max: 500, default: 25,
  },
  AGGREGATOR: {
    min: 20, max: 500, default: 25,
  },
  OWNER_OPERATOR: {
    min: 1, max: 10, default: 5,
  },
};

const QUOTA_SCALES = {
  vehicleQuota: VEHICLE_SCALE,
  driverQuota: DRIVER_SCALE,
  deviceQuota: DEVICE_SCALE,
  simQuota: SIM_SCALE,
} as const;

export function TenantOnboardingWizard({
  open, onOpenChange, onComplete,
}: TenantOnboardingWizardProps) {
  const [
    currentStep,
    setCurrentStep,
  ] = useState(1);
  const [
    formData,
    setFormData,
  ] = useState<TenantFormData>(initialFormData);
  const [isSubmitting] = useState(false);
  const [
    duplicateInfo,
    setDuplicateInfo,
  ] = useState<{
    count: number; names: string[];
  } | null>(null);
  const [
    isCheckingDuplicate,
    setIsCheckingDuplicate,
  ] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  // Plans applicable to the chosen organization type

  const updateFormData = (updates: Partial<TenantFormData>) => {
    setFormData(prev => ({
      ...prev, ...updates,
    }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1: {
        if (!formData.organizationType) {
          toast.error("Please select an organization role");
          return false;
        }
        const requiresContact = formData.organizationType !== "OWNER_OPERATOR";
        if (!formData.companyName || !formData.email || !formData.phone) {
          toast.error(`Please fill in ${NAME_LABEL[formData.organizationType].toLowerCase()}, business email, and phone number`);
          return false;
        }
        if (requiresContact && !formData.primaryContactName) {
          toast.error("Please fill in the primary contact name");
          return false;
        }
        if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid business email address");
          return false;
        }
        if (formData.billingEmail && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(formData.billingEmail)) {
          toast.error("Please enter a valid billing email address");
          return false;
        }
        return true;
      }
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /** Look up existing organizations of the same type with a matching name (case-insensitive). */
  const checkForDuplicateOrgName = async (): Promise<{
    count: number; names: string[];
  }> => {
    return {
      count: 0, names: [],
    };
  };

  /** Entry point from the Complete Setup button — runs duplicate check first. */
  const performSubmit = async () => {
    toast.info("Coming soon");
  };

  const handleAttemptSubmit = async () => {
    if (!validateStep())
      return;
    setIsCheckingDuplicate(true);
    try {
      const dup = await checkForDuplicateOrgName();
      if (dup.count > 0) {
        setDuplicateInfo(dup);
        return; // wait for user confirmation in the AlertDialog
      }
      await performSubmit();
    }
    finally {
      setIsCheckingDuplicate(false);
    }
  };

  /** Actual tenant creation + audit log — runs after any required confirmation. */
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            New Tenant Onboarding
          </DialogTitle>
          <DialogDescription>
            Complete the setup wizard to create a new tenant organization
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress
            value={progress}
            className="h-2"
          />
          <div className="flex justify-between">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 text-xs ${
                    isActive ? "text-primary font-medium" : isCompleted ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                      isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-success text-success-foreground" : "bg-muted"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                  </div>
                  <span className="hidden md:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Organization Role + Role-specific details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Organization Role *</Label>
                <p className="text-xs text-muted-foreground">
                  Choose the role for this tenant. The form below adapts to the role you pick.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {orgTypeOptions.map(opt => (
                    <Card
                      key={opt.value}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        formData.organizationType === opt.value ? "border-primary ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => updateFormData({ organizationType: opt.value })}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{opt.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {NAME_LABEL[formData.organizationType]}
                    {" "}
                    *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      className="pl-10"
                      value={formData.companyName}
                      onChange={e => updateFormData({ companyName: e.target.value })}
                      placeholder=""
                    />
                  </div>
                </div>

                {formData.organizationType !== "OWNER_OPERATOR" && (
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactName">Contact Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="primaryContactName"
                        className="pl-10"
                        value={formData.primaryContactName}
                        onChange={e => updateFormData({ primaryContactName: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={formData.email}
                        onChange={e => updateFormData({ email: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Billing Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="billingEmail"
                        type="email"
                        className="pl-10"
                        value={formData.billingEmail}
                        onChange={e => updateFormData({ billingEmail: e.target.value })}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={formData.phone}
                      onChange={e => updateFormData({ phone: e.target.value })}
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 (Quotas & Billing) removed — defaults are submitted as-is */}
          {false && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Operational Quotas & Billing Model</CardTitle>
                      <CardDescription>
                        Set the per-resource limits for this tenant and choose the billing model. Limits are enforced when users add vehicles, drivers, devices or SIMs.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Billing model: Subscription vs Trial */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Billing Model *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        {
                          value: "SUBSCRIPTION", title: "Subscription", desc: "Paid plan, billed on the chosen cycle",
                        },
                        {
                          value: "TRIAL", title: "Trial", desc: "Free access for evaluation period",
                        },
                      ] as const).map(opt => (
                        <Card
                          key={opt.value}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            formData.billingModel === opt.value ? "border-primary ring-2 ring-primary/20" : ""
                          }`}
                          onClick={() => updateFormData({ billingModel: opt.value })}
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm">{opt.title}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {formData.billingModel === "TRIAL" && (
                    <>
                      <Separator />
                      <div className="space-y-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-warning" />
                          <Label className="text-sm font-medium">Trial Configuration</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Trial tenants get capped allocations and a fixed evaluation window. On expiry, tenants with a payment method on file auto-convert to Active; otherwise they move to Suspended.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="trialDays"
                              className="text-xs"
                            >
                              Trial Duration (days)
                            </Label>
                            <Input
                              id="trialDays"
                              type="number"
                              min={1}
                              max={365}
                              value={formData.trialDays}
                              onChange={e => updateFormData({
                                trialDays: Math.max(
                                  1,
                                  parseInt(
                                    e.target.value,
                                    10,
                                  ) || 30,
                                ),
                              })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="trialVehicleCap"
                              className="text-xs"
                            >
                              Vehicle Cap
                            </Label>
                            <Input
                              id="trialVehicleCap"
                              type="number"
                              min={1}
                              value={formData.trialVehicleCap}
                              onChange={e => updateFormData({
                                trialVehicleCap: Math.max(
                                  1,
                                  parseInt(
                                    e.target.value,
                                    10,
                                  ) || 5,
                                ),
                              })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="trialSimCap"
                              className="text-xs"
                            >
                              SIM Cap
                            </Label>
                            <Input
                              id="trialSimCap"
                              type="number"
                              min={1}
                              value={formData.trialSimCap}
                              onChange={e => updateFormData({
                                trialSimCap: Math.max(
                                  1,
                                  parseInt(
                                    e.target.value,
                                    10,
                                  ) || 5,
                                ),
                              })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="trialWhatsappDailyCap"
                              className="text-xs"
                            >
                              WhatsApp / day
                            </Label>
                            <Input
                              id="trialWhatsappDailyCap"
                              type="number"
                              min={1}
                              value={formData.trialWhatsappDailyCap}
                              onChange={e => updateFormData({
                                trialWhatsappDailyCap: Math.max(
                                  1,
                                  parseInt(
                                    e.target.value,
                                    10,
                                  ) || 100,
                                ),
                              })}
                            />
                          </div>
                          <div className="space-y-1.5 col-span-2">
                            <Label
                              htmlFor="trialSmsDailyCap"
                              className="text-xs"
                            >
                              SMS / day
                            </Label>
                            <Input
                              id="trialSmsDailyCap"
                              type="number"
                              min={1}
                              value={formData.trialSmsDailyCap}
                              onChange={e => updateFormData({
                                trialSmsDailyCap: Math.max(
                                  1,
                                  parseInt(
                                    e.target.value,
                                    10,
                                  ) || 50,
                                ),
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Operational Quotas */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Operational Quotas</Label>
                      <p className="text-xs text-muted-foreground">
                        Maximum number of each resource for
                        {" "}
                        {formData.organizationType.replace(
                          "_",
                          " ",
                        ).toLowerCase()}
                        . Drag the slider or type an exact value. These limits are enforced platform-wide.
                      </p>
                    </div>

                    {([
                      {
                        key: "vehicleQuota" as const, label: "Vehicles", icon: TruckIcon,
                      },
                      {
                        key: "driverQuota" as const, label: "Drivers", icon: User,
                      },
                      {
                        key: "deviceQuota" as const, label: "Devices", icon: Cpu,
                      },
                      {
                        key: "simQuota" as const, label: "SIMs", icon: Smartphone,
                      },
                    ]).map(({
                      key, label, icon: Icon,
                    }) => {
                      const scale = QUOTA_SCALES[key][formData.organizationType];
                      const value = formData[key];
                      const sliderValue = Math.min(
                        scale.max,
                        Math.max(
                          scale.min,
                          value || scale.min,
                        ),
                      );
                      return (
                        <div
                          key={key}
                          className="rounded-lg border p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <Label
                              htmlFor={`${key}Input`}
                              className="text-xs flex items-center gap-1.5"
                            >
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              {" "}
                              {label}
                            </Label>
                            <Input
                              id={`${key}Input`}
                              type="number"
                              min={scale.min}
                              max={scale.max}
                              value={value}
                              onChange={(e) => {
                                const v = parseInt(
                                  e.target.value,
                                  10,
                                );
                                updateFormData({ [key]: Number.isNaN(v) ? 0 : v } as Partial<TenantFormData>);
                              }}
                              onBlur={(e) => {
                                const v = parseInt(
                                  e.target.value,
                                  10,
                                );
                                const clamped = Number.isNaN(v)
                                  ? scale.default
                                  : Math.min(
                                      scale.max,
                                      Math.max(
                                        scale.min,
                                        v,
                                      ),
                                    );
                                updateFormData({ [key]: clamped } as Partial<TenantFormData>);
                              }}
                              className="h-8 w-28 text-right text-sm font-semibold tabular-nums"
                            />
                          </div>
                          <Slider
                            min={scale.min}
                            max={scale.max}
                            step={1}
                            value={[sliderValue]}
                            onValueChange={([v]) => updateFormData({ [key]: v } as Partial<TenantFormData>)}
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{scale.min.toLocaleString()}</span>
                            <span>Allowed range</span>
                            <span>{scale.max.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Review */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Organization Details</CardTitle>
                  <CardDescription>Confirm the information before creating the tenant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{NAME_LABEL[formData.organizationType]}</p>
                      <p className="font-medium">{formData.companyName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Organization Type</p>
                      <p className="font-medium">
                        {orgTypeOptions.find(o => o.value === formData.organizationType)?.label || formData.organizationType.replace(
                          "_",
                          " ",
                        )}
                      </p>
                    </div>
                    {formData.organizationType !== "OWNER_OPERATOR" && (
                      <div>
                        <p className="text-muted-foreground">Primary Contact</p>
                        <p className="font-medium">{formData.primaryContactName || "-"}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Business Email</p>
                      <p className="font-medium">{formData.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Billing Email</p>
                      <p className="font-medium">{formData.billingEmail || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{formData.phone || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Tenant Created Successfully</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  An invitation email with the setup link has been sent to
                  {" "}
                  <span className="font-medium text-foreground">{formData.email}</span>
                  . The
                  recipient should check their inbox to complete the account setup.
                </p>
              </div>
              <Card className="w-full max-w-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sent to</span>
                    <span className="font-medium ml-auto">{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Organization</span>
                    <span className="font-medium ml-auto">{formData.companyName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium ml-auto capitalize">
                      {formData.organizationType.replace(
                        "_",
                        " ",
                      ).toLowerCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Separator />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || currentStep === 3}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep === 3
            ? (
                <Button
                  onClick={() => {
                    onComplete(formData);
                    onOpenChange(false);
                    setCurrentStep(1);
                    setFormData(initialFormData);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              )
            : currentStep < steps.length
              ? (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              : (
                  <Button
                    onClick={handleAttemptSubmit}
                    disabled={isSubmitting || isCheckingDuplicate}
                  >
                    {isSubmitting || isCheckingDuplicate
                      ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isCheckingDuplicate ? "Checking..." : "Creating Tenant..."}
                          </>
                        )
                      : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Complete Setup
                          </>
                        )}
                  </Button>
                )}
        </div>
      </DialogContent>

      {/* Duplicate-name confirmation — soft warning, not a block */}
      <AlertDialog
        open={!!duplicateInfo}
        onOpenChange={(o) => {
          if (!o)
            setDuplicateInfo(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Duplicate organization name
            </AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateInfo?.count === 1
                ? (
                    <>
                      An organization named
                      {" "}
                      <span className="font-semibold text-foreground">
                        "
                        {duplicateInfo?.names[0]}
                        "
                      </span>
                      {" "}
                      already exists under the
                      {" "}
                      <span className="font-semibold text-foreground">{formData.organizationType}</span>
                      {" "}
                      tenant type. Do you still want to create another one?
                    </>
                  )
                : (
                    <>
                      <span className="font-semibold text-foreground">{duplicateInfo?.count}</span>
                      {" "}
                      organizations named
                      {" "}
                      <span className="font-semibold text-foreground">
                        "
                        {formData.companyName}
                        "
                      </span>
                      {" "}
                      already exist under the
                      {" "}
                      <span className="font-semibold text-foreground">{formData.organizationType}</span>
                      {" "}
                      tenant type. Do you still want to create another one?
                    </>
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={async (e) => {
                e.preventDefault();
                setDuplicateInfo(null);
                await performSubmit();
              }}
            >
              Create anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
