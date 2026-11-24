import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
  useUploadMedia,
} from "@truckmoov/api/auth";
import {
  Building2, Camera, RefreshCw, Save,
} from "lucide-react";
import {
  useEffect, useRef,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { PageActions } from "@/shared/components/layout/PageTitle";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const platformProfileSchema = z.object({
  platformName: z.string().trim().min(
    1,
    "Platform name cannot be empty.",
  ),
  supportEmail: z.string().trim().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(
    32,
    "Phone number is too long.",
  ),
  contactAddress: z.string().trim().max(
    300,
    "Address is too long.",
  ),
});

type PlatformProfileFormValues = z.infer<typeof platformProfileSchema>;

export const PLATFORM_PROFILE_FORM_ID = "platform-profile-form";

const DEFAULT_PLATFORM_PROFILE: PlatformProfileFormValues = {
  platformName: "",
  supportEmail: "",
  contactPhone: "",
  contactAddress: "",
};

/**
 * `/settings/platform-profile` — fleetflow's Platform Profile card, backed by
 * system settings: `platformName`, `supportEmail` (shared with Support
 * Preferences) and `profile` (contact phone, address, logo). A picked logo is
 * uploaded and saved straight away; the form fields save with Save Profile.
 */
export function PlatformProfilePanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const systemSettings = systemSettingsQuery.data?.data;
  const updateSettings = useUpdateSystemSettings();
  const uploadMedia = useUploadMedia();
  const platformLogo = systemSettings?.profile?.logoUrl ?? undefined;
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PlatformProfileFormValues>({
    resolver: zodResolver(platformProfileSchema),
    defaultValues: DEFAULT_PLATFORM_PROFILE,
  });

  useEffect(
    () => {
      if (!systemSettings)
        return;
      form.reset({
        ...form.getValues(),
        platformName: systemSettings.platformName ?? "",
        supportEmail: systemSettings.supportEmail ?? "",
        contactPhone: systemSettings.profile?.contactPhone ?? "",
        contactAddress: systemSettings.profile?.contactAddress ?? "",
      });
    },
    [
      systemSettings,
      form,
    ],
  );

  const platformName = form.watch("platformName");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file)
      return;
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    uploadMedia.mutate(
      file,
      {
        onSuccess: res => updateSettings.mutate(
          { data: { profile: { logoUrl: res.data.url } } },
          {
            onSuccess: () => toast.success("Logo updated"),
            onError: error => toast.error(error.message),
          },
        ),
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleSave = (values: PlatformProfileFormValues) => {
    updateSettings.mutate(
      {
        data: {
          platformName: values.platformName,
          supportEmail: values.supportEmail,
          profile: {
            contactPhone: values.contactPhone, contactAddress: values.contactAddress,
          },
        },
      },
      {
        onSuccess: () => toast.success("Platform profile saved"),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Platform Profile
        </CardTitle>
        <CardDescription>Platform name, logo and public contact details shown to tenants.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 rounded-2xl">
              <AvatarImage
                src={platformLogo}
                alt={platformName}
              />
              <AvatarFallback className="rounded-2xl text-lg">{(platformName || "F").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              disabled={uploadMedia.isPending}
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:opacity-90"
              aria-label="Change logo"
            >
              {uploadMedia.isPending
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
          <div>
            <p className="font-medium">{platformName}</p>
            <p className="text-xs text-muted-foreground">PNG or SVG, under 2MB</p>
          </div>
        </div>
        <Form {...form}>
          <form
            id={PLATFORM_PROFILE_FORM_ID}
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="platformName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel required>Platform Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel required>Support Email</FormLabel>
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
                name="contactPhone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Contact Phone</FormLabel>
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
                name="contactAddress"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Business Address</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <PageActions>
              <Button
                type="submit"
                form={PLATFORM_PROFILE_FORM_ID}
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
                        Save Profile
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
