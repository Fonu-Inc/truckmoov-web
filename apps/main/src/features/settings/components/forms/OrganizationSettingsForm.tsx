import type { OrganizationSettingsFormValues } from "./organizationSettingsFormConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationSettingsQueryOptions,
  useUpdateOrganizationSettings,
  useUploadMedia,
} from "@truckmoov/api/auth";
import {
  Globe, ImageIcon, Phone, Save, Upload,
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
import { OrganizationAccountSecurityCard } from "@/features/settings/components/ui/OrganizationAccountSecurityCard";
import {
  EMPTY_ORGANIZATION_SETTINGS,
  isValidOrganizationImage,
  isValidProfileImage,
  ORGANIZATION_IMAGE_TYPES,
  ORGANIZATION_SETTINGS_FORM_ID,
  organizationSettingsSchema,
  organizationSettingsToFormValues,
  organizationSettingsToPayload,
  PROFILE_IMAGE_TYPES,
} from "./organizationSettingsFormConfig";

/** The design app's card surface — the shared `Card` adds its own border/shadow. */
const CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";
const CARD_HEADER_CLASS = "flex flex-col space-y-1.5 p-6 pb-4";
const CARD_TITLE_CLASS = "text-base font-semibold leading-none tracking-tight text-foreground font-display";

const TIMEZONE_OPTIONS = [
  {
    value: "Africa/Lagos", label: "West Africa Time (GMT+1)",
  },
  {
    value: "Africa/Johannesburg", label: "South Africa Standard Time (GMT+2)",
  },
  {
    value: "Africa/Nairobi", label: "East Africa Time (GMT+3)",
  },
  {
    value: "Europe/London", label: "Greenwich Mean Time (GMT)",
  },
];

const LANGUAGE_OPTIONS = [
  {
    value: "en", label: "English",
  },
  {
    value: "ha", label: "Hausa",
  },
  {
    value: "yo", label: "Yoruba",
  },
  {
    value: "ig", label: "Igbo",
  },
  {
    value: "pcm", label: "Nigerian Pidgin",
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function LoadingCards() {
  return (
    <>
      {[
        "profile-image",
        "organization-profile",
        "display-preferences",
      ].map(key => (
        <div
          key={key}
          className={CARD_CLASS}
        >
          <div className={CARD_HEADER_CLASS}>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="p-6 pt-0">
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * The Organization tab (`/settings`): every card inside the design app's panel,
 * in its order — Profile Image, Telematics Number, Organization Profile,
 * Account & Security, Display Preferences. One form holds the org settings so
 * the profile save never sends a stale timezone/language or profile image.
 */
export function OrganizationSettingsForm() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const settingsQuery = useQuery(getOrganizationSettingsQueryOptions());
  const photoUploadMutation = useUploadMedia();
  const logoUploadMutation = useUploadMedia();
  const updateMutation = useUpdateOrganizationSettings();
  // Profile image and display preferences save on their own (their cards have no button).
  const instantUpdateMutation = useUpdateOrganizationSettings();
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

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file)
      return;

    if (!isValidProfileImage(file)) {
      toast.error("Upload a PNG, JPG, SVG or WebP image up to 2MB.");
      return;
    }

    try {
      const response = await photoUploadMutation.mutateAsync(file);
      const profilePictureUrl = response.data.url;
      await instantUpdateMutation.mutateAsync({ data: { branding: { profilePictureUrl } } });
      form.setValue(
        "profilePictureUrl",
        profilePictureUrl,
      );
      toast.success("Profile image updated.");
    }
    catch (error) {
      toast.error(getErrorMessage(
        error,
        "Unable to upload image.",
      ));
    }
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file)
      return;

    if (!isValidOrganizationImage(file)) {
      toast.error("Upload a PNG or JPG image up to 2MB.");
      return;
    }

    try {
      const response = await logoUploadMutation.mutateAsync(file);
      form.setValue(
        "logoUrl",
        response.data.url,
        {
          shouldDirty: true, shouldValidate: true,
        },
      );
      toast.success("Logo uploaded. Save changes to apply it.");
    }
    catch (error) {
      toast.error(getErrorMessage(
        error,
        "Unable to upload image.",
      ));
    }
  }

  function handleDisplayPreferenceChange(key: "timezone" | "language", value: string) {
    form.setValue(
      key,
      value,
    );
    instantUpdateMutation.mutate(
      { data: { defaults: { [key]: value } } },
      {
        onSuccess: () => toast.success("Display preferences saved."),
        onError: error => toast.error(error.message),
      },
    );
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
    return <LoadingCards />;

  if (settingsQuery.isError) {
    return (
      <div className={CARD_CLASS}>
        <div className={CARD_HEADER_CLASS}>
          <h3 className={CARD_TITLE_CLASS}>Organization Profile</h3>
          <p className="text-sm text-muted-foreground">We could not load your organization settings.</p>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <p className="text-sm text-destructive">{settingsQuery.error.message}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => settingsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const organizationName = form.watch("organizationName");
  const logoUrl = form.watch("logoUrl");
  const profilePictureUrl = form.watch("profilePictureUrl");
  const timezone = form.watch("timezone");
  const language = form.watch("language");

  return (
    <>
      <div className={CARD_CLASS}>
        <div className={CARD_HEADER_CLASS}>
          <h3 className={`${CARD_TITLE_CLASS} flex items-center gap-2`}>
            <ImageIcon className="h-5 w-5" />
            Profile Image
          </h3>
          <p className="text-sm text-muted-foreground">Upload your profile picture. It will appear in the sidebar and header.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage
                src={profilePictureUrl || undefined}
                alt="Profile"
              />
              <AvatarFallback className="bg-primary/20 text-primary text-xl rounded-lg">Photo</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={photoInputRef}
                type="file"
                accept={PROFILE_IMAGE_TYPES.join(",")}
                className="hidden"
                aria-label="Upload profile photo"
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={photoUploadMutation.isPending}
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP. Max 2MB.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={CARD_CLASS}>
        <div className={CARD_HEADER_CLASS}>
          <h3 className={`${CARD_TITLE_CLASS} flex items-center gap-2`}>
            <Phone className="h-4 w-4" />
            Telematics Number
          </h3>
          <p className="text-sm text-muted-foreground">Your account's telematics number for fleet management service. This is separate from your tracking device SIMs.</p>
        </div>
        <div className="p-6 pt-0">
          {/* No endpoint serves the tenant's telematics number yet, so the value is "-"
              rather than the design app's "none assigned" claim, which we can't back. */}
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">-</p>
        </div>
      </div>

      <div className={CARD_CLASS}>
        <div className={CARD_HEADER_CLASS}>
          <h3 className={CARD_TITLE_CLASS}>Organization Profile</h3>
          <p className="text-sm text-muted-foreground">Manage your organization's information and branding</p>
        </div>
        <Form {...form}>
          <form
            id={ORGANIZATION_SETTINGS_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 pt-0 space-y-6"
          >
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={logoUrl || "/placeholder.svg"}
                  alt={organizationName || "Organization"}
                />
              </Avatar>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={ORGANIZATION_IMAGE_TYPES.join(",")}
                  className="hidden"
                  aria-label="Upload organization logo"
                  onChange={handleLogoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={logoUploadMutation.isPending}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {/* No endpoint stores a billing email yet, so the field shows "-" and is locked. */}
              <div className="space-y-2">
                <Label htmlFor="orgBillingEmail">Billing Email</Label>
                <Input
                  id="orgBillingEmail"
                  type="text"
                  placeholder="billing@company.com"
                  value="-"
                  readOnly
                  disabled
                />
              </div>
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                        className="rounded-xl"
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
                disabled={logoUploadMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <OrganizationAccountSecurityCard />

      <div className={CARD_CLASS}>
        <div className={CARD_HEADER_CLASS}>
          <h3 className={`${CARD_TITLE_CLASS} flex items-center gap-2`}>
            <Globe className="h-5 w-5 text-primary" />
            Display Preferences
          </h3>
          <p className="text-sm text-muted-foreground">Time and language defaults used for charts, tables, and reports.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultTimezone">Default Timezone</Label>
              <Select
                value={timezone}
                onValueChange={value => handleDisplayPreferenceChange(
                  "timezone",
                  value,
                )}
              >
                <SelectTrigger
                  id="defaultTimezone"
                  className="h-10 rounded-xl px-3.5"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Default Language</Label>
              <Select
                value={language}
                onValueChange={value => handleDisplayPreferenceChange(
                  "language",
                  value,
                )}
              >
                <SelectTrigger
                  id="defaultLanguage"
                  className="h-10 rounded-xl px-3.5"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
