import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { Separator } from "@/components/shadcn/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
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
import {
  Building2,
  User,
  Mail,
  Phone,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateTenant } from "@truckmoov/api/auth";

type OrgType = "FLEET_PROVIDER" | "ENTERPRISE" | "AGGREGATOR" | "OWNER_OPERATOR";

const step1Schema = z
  .object({
    organizationType: z.enum(["FLEET_PROVIDER", "ENTERPRISE", "AGGREGATOR", "OWNER_OPERATOR"]),
    companyName: z.string().min(1, "Company name is required"),
    primaryContactName: z.string().optional(),
    email: z.string().min(1, "Business email is required").email("Invalid email address"),
    billingEmail: z.string().min(1, "Billing email is required").email("Invalid billing email"),
    phone: z.string().min(1, "Phone number is required"),
  })
  .superRefine((data, ctx) => {
    if (data.organizationType !== "OWNER_OPERATOR" && !data.primaryContactName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact name is required",
        path: ["primaryContactName"],
      });
    }
  });

type Step1Values = z.infer<typeof step1Schema>;

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: Step1Values) => void;
}

const orgTypeOptions: { value: OrgType; label: string; description: string; icon: string }[] = [
  { value: "FLEET_PROVIDER", label: "Fleet Provider", description: "Operates vehicles & drivers, executes transport jobs", icon: "🚛" },
  { value: "ENTERPRISE", label: "Enterprise (Cargo Owner)", description: "Creates jobs, contracts providers, monitors SLAs", icon: "🏢" },
  { value: "AGGREGATOR", label: "Aggregator", description: "Coordinates owner-operators, brokers work across fleets", icon: "🔗" },
  { value: "OWNER_OPERATOR", label: "Owner-Operator", description: "Independent operator with own vehicle(s)", icon: "👤" },
];

const steps = [
  { id: 1, title: "Organization & Details", icon: Building2 },
  { id: 2, title: "Review", icon: Check },
  { id: 3, title: "Confirmation", icon: CheckCircle2 },
];

const NAME_LABEL: Record<OrgType, string> = {
  ENTERPRISE: "Organization Name",
  FLEET_PROVIDER: "Company Name",
  AGGREGATOR: "Aggregator Name",
  OWNER_OPERATOR: "Company Name",
};

const COMPANY_PLACEHOLDER: Record<OrgType, string> = {
  ENTERPRISE: "e.g. Dangote Industries Ltd.",
  FLEET_PROVIDER: "e.g. Apex Logistics Ltd.",
  AGGREGATOR: "e.g. FleetConnect Hub",
  OWNER_OPERATOR: "e.g. Musa's Haulage",
};

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [duplicateInfo, setDuplicateInfo] = useState<{ count: number; names: string[] } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const createTenant = useCreateTenant();

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      organizationType: "FLEET_PROVIDER",
      companyName: "",
      primaryContactName: "",
      email: "",
      billingEmail: "",
      phone: "",
    },
  });

  const progress = (currentStep / steps.length) * 100;
  const orgType = form.watch("organizationType");

  const handleNextStep = async () => {
    const valid = await form.trigger();
    if (valid) setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
  };

  const checkForDuplicateOrgName = async (): Promise<{ count: number; names: string[] }> => {
    return { count: 0, names: [] };
  };

  const handleAttemptSubmit = async () => {
    setIsCheckingDuplicate(true);
    try {
      const dup = await checkForDuplicateOrgName();
      if (dup.count > 0) {
        setDuplicateInfo(dup);
        return;
      }
      await performSubmit();
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const performSubmit = async () => {
    const values = form.getValues();
    try {
      await createTenant.mutateAsync({
        data: {
          company: {
            name: values.companyName,
            primaryContactName: values.primaryContactName,
            contactEmail: values.email,
            billingEmail: values.billingEmail,
            contactPhone: values.phone,
            organizationType: values.organizationType,
          },
          subscription: {
            plan: "starter",
            billingModel: "SUBSCRIPTION",
            billingMode: "PREPAID",
            billingCycle: "MONTHLY",
          },
          features: {
            liveTracking: true,
            geofencing: false,
            routeOptimization: false,
            messaging: true,
            analytics: false,
            apiAccess: false,
          },
        },
      });
      setCurrentStep(3);
    } catch {
      toast.error("Failed to create tenant. Please try again.");
    }
  };

  const handleDone = () => {
    onComplete(form.getValues());
    onOpenChange(false);
    setCurrentStep(1);
    form.reset();
  };

  const handleOpenChange = (o: boolean) => {
    if (!o && createTenant.isPending) return;
    onOpenChange(o);
    if (!o) {
      setCurrentStep(1);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-success text-success-foreground"
                        : "bg-muted"
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
          {/* Step 1: Organization Role + Details */}
          {currentStep === 1 && (
            <Form {...form}>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="organizationType"
                  render={() => (
                    <FormItem>
                      <FormLabel>Organization Role *</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Choose the role for this tenant. The form below adapts to the role you pick.
                      </p>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          {orgTypeOptions.map((opt) => (
                            <Card
                              key={opt.value}
                              className={`cursor-pointer transition-all hover:border-primary/50 ${
                                orgType === opt.value ? "border-primary ring-2 ring-primary/20" : ""
                              }`}
                              onClick={() =>
                                form.setValue("organizationType", opt.value, { shouldValidate: true })
                              }
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{NAME_LABEL[orgType]} *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              placeholder={COMPANY_PLACEHOLDER[orgType]}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {orgType !== "OWNER_OPERATOR" && (
                    <FormField
                      control={form.control}
                      name="primaryContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-10"
                                placeholder="e.g. Amaka Johnson"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                className="pl-10"
                                placeholder="company@example.com"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                className="pl-10"
                                placeholder="billing@example.com"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              placeholder="+234 801 234 5678"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Form>
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
                      <p className="text-muted-foreground">{NAME_LABEL[orgType]}</p>
                      <p className="font-medium">{form.watch("companyName") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Organization Type</p>
                      <p className="font-medium">
                        {orgTypeOptions.find((o) => o.value === orgType)?.label ||
                          orgType.replace("_", " ")}
                      </p>
                    </div>
                    {orgType !== "OWNER_OPERATOR" && (
                      <div>
                        <p className="text-muted-foreground">Primary Contact</p>
                        <p className="font-medium">{form.watch("primaryContactName") || "-"}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Business Email</p>
                      <p className="font-medium">{form.watch("email") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Billing Email</p>
                      <p className="font-medium">{form.watch("billingEmail") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{form.watch("phone") || "-"}</p>
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
                  An invitation email with the setup link has been sent to{" "}
                  <span className="font-medium text-foreground">{form.watch("email")}</span>. The
                  recipient should check their inbox to complete the account setup.
                </p>
              </div>
              <Card className="w-full max-w-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sent to</span>
                    <span className="font-medium ml-auto">{form.watch("email")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Organization</span>
                    <span className="font-medium ml-auto">{form.watch("companyName")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium ml-auto">
                      {orgTypeOptions.find((o) => o.value === orgType)?.label ||
                        orgType.replace("_", " ")}
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

          {currentStep === 3 ? (
            <Button onClick={handleDone}>
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          ) : currentStep === 2 ? (
            <Button
              onClick={handleAttemptSubmit}
              disabled={createTenant.isPending || isCheckingDuplicate}
            >
              {createTenant.isPending || isCheckingDuplicate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isCheckingDuplicate ? "Checking..." : "Creating Tenant..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Duplicate-name confirmation */}
      <AlertDialog open={!!duplicateInfo} onOpenChange={(o) => { if (!o) setDuplicateInfo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Duplicate organization name
            </AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateInfo?.count === 1 ? (
                <>
                  An organization named{" "}
                  <span className="font-semibold text-foreground">"{duplicateInfo?.names[0]}"</span>{" "}
                  already exists. Do you still want to create another one?
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{duplicateInfo?.count}</span>{" "}
                  organizations with this name already exist. Do you still want to create another one?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createTenant.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={createTenant.isPending}
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
