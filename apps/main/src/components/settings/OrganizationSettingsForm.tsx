import type { OrganizationSettingsFormValues } from "./organizationSettingsFormConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationSettingsQueryOptions,
  useUpdateOrganizationSettings,
  useUploadMedia,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  Save, Upload,
} from "lucide-react";

import {
  useEffect, useRef,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";
import {
  EMPTY_ORGANIZATION_SETTINGS,
  MAX_ORGANIZATION_IMAGE_SIZE,
  ORGANIZATION_IMAGE_TYPES,
  ORGANIZATION_SETTINGS_FORM_ID,

  organizationSettingsSchema,
  organizationSettingsToFormValues,
  organizationSettingsToPayload,
} from "./organizationSettingsFormConfig";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function LoadingCard() {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-20 w-64 max-w-full" />
        <Separator />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-16 w-full"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationSettingsForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsQuery = useQuery(getOrganizationSettingsQueryOptions());
  const uploadMutation = useUploadMedia();
  const updateMutation = useUpdateOrganizationSettings();
  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: EMPTY_ORGANIZATION_SETTINGS,
  });

  useEffect(
    () => {
      if (settingsQuery.data?.data && !form.formState.isDirty) {
        form.reset(organizationSettingsToFormValues(settingsQuery.data.data));
      }
    },
    [
      form,
      form.formState.isDirty,
      settingsQuery.data,
    ],
  );

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file)
      return;

    if (!ORGANIZATION_IMAGE_TYPES.includes(file.type as (typeof ORGANIZATION_IMAGE_TYPES)[number])) {
      toast.error("Upload a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_ORGANIZATION_IMAGE_SIZE) {
      toast.error("Image size must not exceed 2 MB.");
      return;
    }

    try {
      const response = await uploadMutation.mutateAsync(file);
      form.setValue(
        "profilePictureUrl",
        response.data.url,
        {
          shouldDirty: true, shouldValidate: true,
        },
      );
      toast.success("Image uploaded. Save changes to apply it.");
    }
    catch (error) {
      toast.error(getErrorMessage(
        error,
        "Unable to upload image.",
      ));
    }
  }

  function onSubmit(values: OrganizationSettingsFormValues) {
    updateMutation.mutate(
      organizationSettingsToPayload(values),
      {
        onSuccess: (response) => {
          form.reset(organizationSettingsToFormValues(response.data));
          toast.success("Organization settings saved successfully.");
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  if (settingsQuery.isPending)
    return <LoadingCard />;

  if (settingsQuery.isError) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>We could not load your organization settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{settingsQuery.error.message}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => settingsQuery.refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const organizationName = form.watch("organizationName");
  const profilePictureUrl = form.watch("profilePictureUrl");

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Manage your organization's information and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form
            id={ORGANIZATION_SETTINGS_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={profilePictureUrl || undefined}
                  alt={organizationName || "Organization"}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl">
                  {getInitials(organizationName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ORGANIZATION_IMAGE_TYPES.join(",")}
                  className="hidden"
                  aria-label="Upload organization logo"
                  onChange={handleImageChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                      <Input
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="organizationBillingEmail">Billing Email</Label>
                <Input
                  id="organizationBillingEmail"
                  type="email"
                  placeholder="billing@company.com"
                  disabled
                />
              </div>
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        {...field}
                      />
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
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (WAT, GMT+1)</SelectItem>
                        <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
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
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                      <Textarea
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="gradient"
                loading={updateMutation.isPending}
                disabled={uploadMutation.isPending}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
