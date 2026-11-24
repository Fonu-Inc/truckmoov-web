import type {
  SubscriptionPlan,
  SystemTenant,
  TenantOnboardingInput,
} from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateTenant } from "@truckmoov/api/auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

const organizationRoleOptions = [
  {
    value: "FLEET_PROVIDER",
    label: "Fleet Provider",
  },
  {
    value: "ENTERPRISE",
    label: "Enterprise",
  },
  {
    value: "AGGREGATOR",
    label: "Aggregator",
  },
  {
    value: "OWNER_OPERATOR",
    label: "Owner Operator",
  },
] as const;

type OrganizationRole = (typeof organizationRoleOptions)[number]["value"];

const schema = z.object({
  name: z.string().min(
    1,
    "Company name is required",
  ),
  email: z.string().min(
    1,
    "Email is required",
  ).email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  billingEmail: z
    .string()
    .email("Invalid billing email")
    .optional()
    .or(z.literal("")),
  organizationType: z.enum([
    "FLEET_PROVIDER",
    "ENTERPRISE",
    "AGGREGATOR",
    "OWNER_OPERATOR",
  ]),
  planCode: z.string().min(
    1,
    "Subscription plan is required",
  ),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  tenant: SystemTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionPlans: SubscriptionPlan[];
  isSubscriptionPlansLoading?: boolean;
};

function normalizeOrganizationType(value?: string | null): OrganizationRole | null {
  if (!value)
    return null;
  const normalized = value.toUpperCase();
  return organizationRoleOptions.some(option => option.value === normalized)
    ? (normalized as OrganizationRole)
    : null;
}

function getTenantOrganizationType(tenant: SystemTenant): OrganizationRole {
  return normalizeOrganizationType(tenant.organizationType)
    ?? normalizeOrganizationType(tenant.organizationTypes?.[0])
    ?? "FLEET_PROVIDER";
}

function getTenantPlanCode(tenant: SystemTenant, subscriptionPlans: SubscriptionPlan[]): string {
  return tenant.planCode
    ?? subscriptionPlans.find(plan => plan.tier === tenant.plan)?.code
    ?? subscriptionPlans[0]?.code
    ?? "";
}

export function TenantEditDialog({
  tenant,
  open,
  onOpenChange,
  subscriptionPlans,
  isSubscriptionPlansLoading = false,
}: Props) {
  const updateTenantMutation = useUpdateTenant();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      billingEmail: "",
      organizationType: "FLEET_PROVIDER",
      planCode: "",
    },
  });

  useEffect(
    () => {
      if (tenant) {
        form.reset({
          name: tenant.name ?? "",
          email: tenant.email ?? "",
          phone: tenant.phone ?? "",
          address: tenant.address ?? "",
          billingEmail: tenant.billingEmail ?? "",
          organizationType: getTenantOrganizationType(tenant),
          planCode: getTenantPlanCode(
            tenant,
            subscriptionPlans,
          ),
        });
      }
    },
    [
      tenant,
      form,
      subscriptionPlans,
    ],
  );

  const onSubmit = async (values: FormValues) => {
    if (!tenant)
      return;
    await updateTenantMutation.mutateAsync({
      id: tenant.id,
      data: {
        company: {
          companyName: values.name,
          email: values.email,
          phoneNumber: values.phone || null,
          businessAddress: values.address || null,
          billingEmail: values.billingEmail || null,
          organizationType: values.organizationType.toLowerCase() as TenantOnboardingInput["company"]["organizationType"],
        },
        subscription: { planCode: values.planCode },
      },
    });
    toast.success(`${values.name} updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update tenant information and organization role
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Logistics Ltd"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+234 801 000 0000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Marina St, Lagos"
                      {...field}
                    />
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
                  <FormLabel>Billing Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="billing@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Organization Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationRoleOptions.map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Subscription Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubscriptionPlansLoading || subscriptionPlans.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isSubscriptionPlansLoading
                              ? "Loading plans..."
                              : "Select subscription plan"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptionPlans.map(plan => (
                        <SelectItem
                          key={plan.code}
                          value={plan.code}
                        >
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateTenantMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTenantMutation.isPending}
              >
                {updateTenantMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
