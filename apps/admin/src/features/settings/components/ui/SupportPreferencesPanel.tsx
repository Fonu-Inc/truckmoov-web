import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import {
  Mail, RefreshCw, Save,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { PageActions } from "@/shared/components/layout/PageTitle";

const supportPreferencesSchema = z.object({
  supportEmail: z.string().trim().email("Enter a valid email address."),
  // ponytail: no API field — wire to packages/api
  supportPhone: z.string(),
  // ponytail: no API field — wire to packages/api
  responseTime: z.enum([
    "4",
    "24",
    "48",
  ]),
});

type SupportPreferencesFormValues = z.infer<typeof supportPreferencesSchema>;

export const SUPPORT_PREFERENCES_FORM_ID = "support-preferences-form";

const DEFAULT_SUPPORT_PREFERENCES: SupportPreferencesFormValues = {
  supportEmail: "",
  supportPhone: "",
  responseTime: "24",
};

/**
 * `/settings/support` — fleetflow's Support Preferences card. Support Contact
 * Email is system settings `supportEmail` (the same value Platform Profile
 * edits). Support Phone and Response Time Commitment have no API field and
 * stay in this page's state — Save sends only the email.
 */
export function SupportPreferencesPanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updateSettings = useUpdateSystemSettings();

  const form = useForm<SupportPreferencesFormValues>({
    resolver: zodResolver(supportPreferencesSchema),
    defaultValues: DEFAULT_SUPPORT_PREFERENCES,
  });

  useEffect(
    () => {
      if (!systemSettings)
        return;
      form.reset({
        ...form.getValues(), supportEmail: systemSettings.supportEmail ?? "",
      });
    },
    [
      systemSettings,
      form,
    ],
  );

  const handleSave = (values: SupportPreferencesFormValues) => {
    updateSettings.mutate(
      { data: { supportEmail: values.supportEmail } },
      {
        onSuccess: () => toast.success("Support preferences saved"),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Support Preferences
        </CardTitle>
        <CardDescription>How tenants reach platform support and how quickly you respond.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            id={SUPPORT_PREFERENCES_FORM_ID}
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Support Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supportPhone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Support Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+234..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responseTime"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Response Time Commitment</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="4">Within 4 hours</SelectItem>
                        <SelectItem value="24">Within 24 hours</SelectItem>
                        <SelectItem value="48">Within 48 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <PageActions>
              <Button
                type="submit"
                form={SUPPORT_PREFERENCES_FORM_ID}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending
                  ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    )
                  : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Support Preferences
                      </>
                    )}
              </Button>
            </PageActions>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
