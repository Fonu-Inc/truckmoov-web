import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOrganizationsSettingsQueryOptions, useUpdateOrganizationSettings, useUpdateUserProfile } from "@/features/auth/api";
import type { Branding, OrganizationSettingsDefaults } from "@/features/auth/api/types";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
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
  language: "en",
  address: "",
 }), [user, organizationSetting])

 const {
  register,
  control,
  handleSubmit,
  reset,
  formState: { errors, isSubmitting, isDirty, dirtyFields },
 } = useForm<OrganizationSettingsFormValues>({
  resolver: zodResolver(organizationSettingsSchema),
  defaultValues: formDefaultValues,
 });

 useEffect(() => {
  reset(formDefaultValues);
 }, [formDefaultValues, reset]);

 const onSubmit = async (values: OrganizationSettingsFormValues) => {
  const calls: Promise<unknown>[] = [];

  if (dirtyFields.fullName || dirtyFields.phoneNumber) {
   calls.push(
    updateUserProfile({
     data: {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
     },
    })
   );
  }

  if (dirtyFields.organizationName || dirtyFields.timezone) {
   calls.push(
    updateOrganizationSettings({
     data: {
      branding: {
       organizationName: values.organizationName
      } as Branding,
      defaults: {
       timezone: values.timezone
      } as OrganizationSettingsDefaults,
     },
    })
   );
  }

  await Promise.all(calls);
 };

 return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
     <Label htmlFor="orgName">Full Name</Label>
     <Input id="fullname" {...register("fullName")} />
     {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
    </div>
    <div className="space-y-2">
     <Label htmlFor="orgName">Organization Name</Label>
     <Input id="orgName" {...register("organizationName")} />
     {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName.message}</p>}
    </div>
    <div className="space-y-2">
     <Label htmlFor="orgEmail">Contact Email</Label>
     <Input id="orgEmail" type="email" {...register("contactEmail")} />
     {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail.message}</p>}
    </div>
    <div className="space-y-2">
     <Label htmlFor="orgPhone">Phone Number</Label>
     <Input id="orgPhone" {...register("phoneNumber")} />
     {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
    </div>
    <div className="space-y-2">
     <Label htmlFor="orgTimezone">Timezone</Label>
     <Controller
      control={control}
      name="timezone"
      render={({ field }) => (
       <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger id="orgTimezone">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="UTC">UTC</SelectItem>
         <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
         <SelectItem value="Europe/London">Europe/London</SelectItem>
         <SelectItem value="America/New_York">America/New York</SelectItem>
         <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
        </SelectContent>
       </Select>
      )}
     />
     {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
    </div>
    <div className="space-y-2">
     <Label htmlFor="orgLanguage">Language</Label>
     <Controller
      control={control}
      name="language"
      render={({ field }) => (
       <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger id="orgLanguage">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="en">English</SelectItem>
         <SelectItem value="ha">Hausa</SelectItem>
         <SelectItem value="yo">Yoruba</SelectItem>
         <SelectItem value="ig">Igbo</SelectItem>
         <SelectItem value="pcm">Nigerian Pidgin</SelectItem>
        </SelectContent>
       </Select>
      )}
     />
     {errors.language && <p className="text-xs text-destructive">{errors.language.message}</p>}
    </div>
    <div className="space-y-2 md:col-span-2">
     <Label htmlFor="orgAddress">Address</Label>
     <Textarea id="orgAddress" rows={2} {...register("address")} />
     {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
    </div>
   </div>

   <div className="flex justify-end">
    <Button type="submit" isLoading={isSubmitting} disabled={!isDirty || isSubmitting}>
     <Save className="h-4 w-4 mr-2" />
     Save Changes
    </Button>
   </div>
  </form>
 )
}
