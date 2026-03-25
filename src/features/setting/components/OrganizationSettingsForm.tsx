import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOrganizationsSettingsQueryOptions, useUpdateOrganizationSettings, useUpdateUserProfile } from "@/features/auth/api";
import type { Branding, OrganizationSettingsDefaults } from "@/features/auth/api/types";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const organizationSettingsSchema = z.object({
 fullName: z.string().trim().min(1, "Full name is required"),
 organizationName: z.string().trim().min(1, "Organization name is required"),
 contactEmail: z.email("Enter a valid email"),
 phoneNumber: z.string().optional(),
 timezone: z.string().optional(),
 language: z.string().optional(),
 address: z.string().optional(),
});

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

export default function OrganizationSettingsForm() {
 const { user } = useAuthStore()
 const canEditOrgSettings = useMemo(() => {
  if (user.role === "ENTERPRISE_ADMIN") {
   return true;
  }
  return false;
 }, [user])

 const {
  mutateAsync: updateUserProfile,
 } = useUpdateUserProfile()
 const { data } = useQuery(getOrganizationsSettingsQueryOptions())
 const organizationSetting = useMemo(() => ({
  branding: data?.data?.branding,
  defaults: data?.data?.defaults
 }), [data])
 const {
  mutateAsync: updateOrganizationSettings
 } = useUpdateOrganizationSettings();

 const formDefaultValues = useMemo(() => ({
  fullName: user.profile?.fullName ?? "",
  organizationName: organizationSetting?.branding?.organizationName ?? "",
  contactEmail: user.email ?? "",
  phoneNumber: user.profile?.phoneNumber ?? "",
  timezone: organizationSetting?.defaults?.timezone ?? "UTC",
  language: organizationSetting?.defaults?.language ?? "en",
  address: user.profile?.address ?? "",
 }), [user, organizationSetting])

 const form = useForm<OrganizationSettingsFormValues>({
  resolver: zodResolver(organizationSettingsSchema),
  defaultValues: formDefaultValues,
 });

 const { handleSubmit, reset, formState: { isSubmitting, isDirty, dirtyFields } } = form;

 useEffect(() => {
  reset(formDefaultValues);
 }, [formDefaultValues, reset]);

 const onSubmit = async (values: OrganizationSettingsFormValues) => {
  const calls: Promise<unknown>[] = [];

  if (dirtyFields.fullName || dirtyFields.phoneNumber || dirtyFields.address) {
   calls.push(
    updateUserProfile({
     data: {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      address: values.address
     },
    })
   );
  }

  if (dirtyFields.organizationName || dirtyFields.contactEmail || dirtyFields.timezone || dirtyFields.language) {
   calls.push(
    updateOrganizationSettings({
     data: {
      branding: {
       organizationName: values.organizationName,
       contactEmail: values.contactEmail,
      } as Branding,
      defaults: {
       timezone: values.timezone,
       language: values.language,
      } as OrganizationSettingsDefaults,
     },
    })
   );
  }

  await Promise.all(calls);
 };

 return (
  <Form {...form}>
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     <FormField
      control={form.control}
      name="fullName"
      render={({ field }) => (
       <FormItem>
        <FormLabel>Full Name</FormLabel>
        <FormControl>
         <Input {...field} />
        </FormControl>
        <FormMessage />
       </FormItem>
      )}
     />
     <FormField
      control={form.control}
      name="organizationName"
      render={({ field }) => (
       <FormItem>
        <FormLabel>Organization Name</FormLabel>
        <FormControl>
         <Input {...field} disabled={!canEditOrgSettings} />
        </FormControl>
        <FormMessage />
       </FormItem>
      )}
     />
     <FormField
      control={form.control}
      name="contactEmail"
      render={({ field }) => (
       <FormItem>
        <FormLabel>Contact Email</FormLabel>
        <FormControl>
         <Input type="email" {...field} disabled={true} />
        </FormControl>
        <FormMessage />
       </FormItem>
      )}
     />
     <FormField
      control={form.control}
      name="phoneNumber"
      render={({ field }) => (
       <FormItem>
        <FormLabel>Phone Number</FormLabel>
        <FormControl>
         <Input {...field} />
        </FormControl>
        <FormMessage />
       </FormItem>
      )}
     />
     <FormField
      control={form.control}
      name="timezone"
      render={({ field }) => (
       <FormItem>
        <FormLabel>Timezone</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
         <FormControl>
          <SelectTrigger disabled={!canEditOrgSettings}>
           <SelectValue />
          </SelectTrigger>
         </FormControl>
         <SelectContent>
          <SelectItem value="UTC">UTC</SelectItem>
          <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
          <SelectItem value="Europe/London">Europe/London</SelectItem>
          <SelectItem value="America/New_York">America/New York</SelectItem>
          <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
         </SelectContent>
        </Select>
        <FormMessage />
       </FormItem>
      )}
     />
     <FormField
      control={form.control}
      name="language"
      render={({ field }) => (
       <FormItem>
        <FormLabel>Language</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
         <FormControl>
          <SelectTrigger disabled={!canEditOrgSettings}>
           <SelectValue />
          </SelectTrigger>
         </FormControl>
         <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ha">Hausa</SelectItem>
          <SelectItem value="yo">Yoruba</SelectItem>
          <SelectItem value="ig">Igbo</SelectItem>
          <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
         </SelectContent>
        </Select>
        <FormMessage />
       </FormItem>
      )}
     />
     <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
       <FormItem className="md:col-span-2">
        <FormLabel>Address</FormLabel>
        <FormControl>
         <Textarea rows={2} {...field} disabled={!canEditOrgSettings} />
        </FormControl>
        <FormMessage />
       </FormItem>
      )}
     />
    </div>

    <div className="flex justify-end">
     <Button type="submit" isLoading={isSubmitting} disabled={!isDirty || isSubmitting}>
      <Save className="h-4 w-4 mr-2" />
      Save Changes
     </Button>
    </div>
   </form>
  </Form>
 )
}
