import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OnboardingPlanStep } from "./OnboardingPlanStep";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Cpu,
  Smartphone,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Truck,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (tenantData: TenantFormData) => void;
}

type OrgType = "FLEET_PROVIDER" | "ENTERPRISE" | "AGGREGATOR" | "OWNER_OPERATOR";

interface TenantFormData {
  // Step 1: Company Details
  companyName: string;
  email: string;
  phone: string;
  address: string;
  billingEmail: string;
  organizationType: OrgType;
  // Step 2: Subscription Plan
  plan: string;
  billingCycle: "MONTHLY" | "YEARLY";
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
}

const initialFormData: TenantFormData = {
  companyName: "",
  email: "",
  phone: "",
  address: "",
  billingEmail: "",
  organizationType: "FLEET_PROVIDER",
  plan: "",
  billingCycle: "MONTHLY",
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

const orgTypeOptions: { value: OrgType; label: string; description: string; icon: string }[] = [
  { value: "FLEET_PROVIDER", label: "Fleet Provider", description: "Operates vehicles & drivers, executes transport jobs", icon: "🚛" },
  { value: "ENTERPRISE", label: "Enterprise (Cargo Owner)", description: "Creates jobs, contracts providers, monitors SLAs", icon: "🏢" },
  { value: "AGGREGATOR", label: "Aggregator", description: "Coordinates owner-operators, brokers work across fleets", icon: "🔗" },
  { value: "OWNER_OPERATOR", label: "Owner-Operator", description: "Independent operator with own vehicle(s)", icon: "👤" },
];

const steps = [
  { id: 1, title: "Company Details", icon: Building2 },
  { id: 2, title: "Subscription Plan", icon: CreditCard },
  { id: 3, title: "Device Provisioning", icon: Cpu },
  { id: 4, title: "SIM Assignment", icon: Smartphone },
  { id: 5, title: "Features & Review", icon: Settings },
];

// Plans are now fetched dynamically from the database via useSubscriptionPlans hook

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TenantFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { format, currency } = useCurrency();

  const progress = (currentStep / steps.length) * 100;

  const updateFormData = (updates: Partial<TenantFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateFeatures = (updates: Partial<TenantFormData["features"]>) => {
    setFormData((prev) => ({
      ...prev,
      features: { ...prev.features, ...updates },
    }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.companyName || !formData.email) {
          toast.error("Please fill in company name and email");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        return true;
      case 2:
        return !!formData.plan;
      case 3:
        // Device provisioning is optional, so always valid
        return true;
      case 4:
        // SIM provisioning is optional, so always valid
        return true;
      case 5:
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

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      // Get current session for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error("You must be logged in to onboard tenants");
        return;
      }

      // Call the tenant-onboarding edge function
      const response = await supabase.functions.invoke("tenant-onboarding", {
        body: {
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          billingEmail: formData.billingEmail,
          organizationType: formData.organizationType,
          plan: formData.plan,
          provisionDevices: formData.provisionDevices,
          deviceCount: formData.deviceCount,
          deviceManufacturer: formData.deviceManufacturer,
          provisionSims: formData.provisionSims,
          simCount: formData.simCount,
          simCarrier: formData.simCarrier,
          dataPackage: formData.dataPackage,
          features: formData.features,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create tenant");
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || "Failed to create tenant");
      }

      onComplete(formData);
      toast.success(
        `Tenant "${formData.companyName}" created! Invitation email sent to ${formData.email}`,
        {
          description: `Tenant URL slug: ${result.tenant?.slug}`,
          duration: 6000,
        }
      );
      onOpenChange(false);
      setCurrentStep(1);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Tenant onboarding error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
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
          {/* Step 1: Company Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      className="pl-10"
                      value={formData.companyName}
                      onChange={(e) => updateFormData({ companyName: e.target.value })}
                      placeholder="ABC Logistics Ltd"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => updateFormData({ email: e.target.value })}
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      placeholder="+234 801 234 5678"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="billingEmail"
                      type="email"
                      className="pl-10"
                      value={formData.billingEmail}
                      onChange={(e) => updateFormData({ billingEmail: e.target.value })}
                      placeholder="billing@company.com"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    className="pl-10"
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                    placeholder="123 Business District, Lagos"
                  />
                </div>
              </div>

              {/* Organization Type Selector */}
              <div className="space-y-2">
                <Label>Organization Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {orgTypeOptions.map((opt) => (
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
            </div>
          )}

          {/* Step 2: Subscription Plan */}
          {currentStep === 2 && (
            <OnboardingPlanStep
              orgType={formData.organizationType}
              orgName={formData.companyName}
              selectedPlanKey={formData.plan}
              billingCycle={formData.billingCycle}
              onSelectPlan={(planKey) => updateFormData({ plan: planKey })}
              onBillingCycleChange={(cycle) => updateFormData({ billingCycle: cycle })}
            />
          )}

          {/* Step 3: Device Provisioning */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>IoT Device Setup</CardTitle>
                        <CardDescription>Configure the GPS tracking devices for this tenant</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="provisionDevices" className="text-sm text-muted-foreground">
                        Provision devices now
                      </Label>
                      <Switch
                        id="provisionDevices"
                        checked={formData.provisionDevices}
                        onCheckedChange={(checked) => updateFormData({ provisionDevices: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!formData.provisionDevices ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
                      <Cpu className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="font-medium text-muted-foreground">Device provisioning skipped</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The Partner Admin will manage their own devices. You can always add devices later from the Devices page.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Number of Devices</Label>
                          <Input
                            type="number"
                            value={formData.deviceCount}
                            onChange={(e) => updateFormData({ deviceCount: parseInt(e.target.value) || 0 })}
                            min={1}
                            max={500}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Device Manufacturer</Label>
                          <Select
                            value={formData.deviceManufacturer}
                            onValueChange={(value) => updateFormData({ deviceManufacturer: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="teltonika">Teltonika</SelectItem>
                              <SelectItem value="queclink">Queclink</SelectItem>
                              <SelectItem value="meitrack">Meitrack</SelectItem>
                              <SelectItem value="calamp">CalAmp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Device Summary</p>
                            <p className="text-sm text-muted-foreground">
                              {formData.deviceCount} x {formData.deviceManufacturer.charAt(0).toUpperCase() + formData.deviceManufacturer.slice(1)} GPS Tracker
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Truck className="h-3 w-3 mr-1" />
                            {formData.deviceCount} Units
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: SIM Assignment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>SIM Card Configuration</CardTitle>
                        <CardDescription>Assign SIM cards and data packages for the devices</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="provisionSims" className="text-sm text-muted-foreground">
                        Provision SIMs now
                      </Label>
                      <Switch
                        id="provisionSims"
                        checked={formData.provisionSims}
                        onCheckedChange={(checked) => updateFormData({ provisionSims: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!formData.provisionSims ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
                      <Smartphone className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="font-medium text-muted-foreground">SIM provisioning skipped</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The Partner Admin can request SIMs later via the IoT SIMs Request page.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Number of SIMs</Label>
                          <Input
                            type="number"
                            value={formData.simCount}
                            onChange={(e) => updateFormData({ simCount: parseInt(e.target.value) || 0 })}
                            min={1}
                            max={500}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Carrier</Label>
                          <Select value={formData.simCarrier} onValueChange={(value) => updateFormData({ simCarrier: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="mtn">MTN</SelectItem>
                              <SelectItem value="airtel">Airtel</SelectItem>
                              <SelectItem value="glo">Glo</SelectItem>
                              <SelectItem value="9mobile">9mobile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data Package</Label>
                          <Select value={formData.dataPackage} onValueChange={(value) => updateFormData({ dataPackage: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="250mb">250MB/month</SelectItem>
                              <SelectItem value="500mb">500MB/month</SelectItem>
                              <SelectItem value="1gb">1GB/month</SelectItem>
                              <SelectItem value="2gb">2GB/month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">SIM Summary</p>
                            <p className="text-sm text-muted-foreground">
                              {formData.simCount} x {formData.simCarrier.toUpperCase()} SIM with {formData.dataPackage.toUpperCase()} data
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Smartphone className="h-3 w-3 mr-1" />
                            {formData.simCount} SIMs
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Features & Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enable Features</CardTitle>
                  <CardDescription>Select the features to enable for this tenant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "liveTracking", label: "Live Tracking", desc: "Real-time GPS tracking" },
                      { key: "geofencing", label: "Geofencing", desc: "Zone alerts & monitoring" },
                      { key: "routeOptimization", label: "Route Optimization", desc: "AI-powered route planning" },
                      { key: "messaging", label: "Messaging", desc: "WhatsApp & SMS integration" },
                      { key: "analytics", label: "Advanced Analytics", desc: "Reports & insights" },
                      { key: "apiAccess", label: "API Access", desc: "REST API integration" },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <Label>{feature.label}</Label>
                          <p className="text-xs text-muted-foreground">{feature.desc}</p>
                        </div>
                        <Switch
                          checked={formData.features[feature.key as keyof typeof formData.features]}
                          onCheckedChange={(checked) => updateFeatures({ [feature.key]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Review Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-medium">{formData.companyName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{formData.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Plan</p>
                      <Badge className="bg-primary/10 text-primary">{formData.plan || "Not selected"}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Billing</p>
                      <p className="font-medium">{formData.billingCycle}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Devices</p>
                      <p className="font-medium">
                        {formData.provisionDevices 
                          ? `${formData.deviceCount} units (${formData.deviceManufacturer})`
                          : <span className="text-muted-foreground italic">Self-managed by Partner</span>
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">SIM Cards</p>
                      <p className="font-medium">
                        {formData.provisionSims 
                          ? `${formData.simCount} SIMs (${formData.simCarrier.toUpperCase()})`
                          : <span className="text-muted-foreground italic">On-demand via requests</span>
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Separator />

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Tenant...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
