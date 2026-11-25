import type { InstallerProfile } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CITIES_BY_STATE,
  NIGERIAN_STATES,
  useUpdateInstallerProfile,
} from "@truckmoov/api/auth";
import { CityCombobox } from "@truckmoov/reusables/components/location/CityCombobox";
import { Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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

// Mirrors UpdateInstallerProfileDto (TRU-FE-21).
const profileDetailsSchema = z.object({
  firstName: z.string().trim().min(
    1,
    "First name is required.",
  ).max(
    60,
    "Keep it under 60 characters.",
  ),
  lastName: z.string().trim().min(
    1,
    "Last name is required.",
  ).max(
    60,
    "Keep it under 60 characters.",
  ),
  phoneNumber: z
    .string()
    .trim()
    .min(
      1,
      "Phone number is required.",
    )
    .max(
      20,
      "Keep it under 20 characters.",
    )
    .regex(
      /^[^a-z]*$/i,
      "Phone number must not contain letters.",
    ),
  state: z.enum(
    NIGERIAN_STATES,
    { message: "Choose a state." },
  ),
  city: z.string().trim().min(
    1,
    "City is required.",
  ).max(
    80,
    "Keep it under 80 characters.",
  ),
});

type ProfileDetailsValues = z.infer<typeof profileDetailsSchema>;

export const PROFILE_DETAILS_FORM_ID = "installer-profile-details-form";

export function ProfileDetailsForm({ personal }: { personal: InstallerProfile["personal"] }) {
  const update = useUpdateInstallerProfile();

  const form = useForm<ProfileDetailsValues>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      firstName: personal.firstName,
      lastName: personal.lastName,
      phoneNumber: personal.phoneNumber,
      // ponytail: a null state starts empty; zod then asks for one on save.
      state: (personal.state ?? "") as ProfileDetailsValues["state"],
      city: personal.city ?? "",
    },
  });

  const state = form.watch("state");
  const lgas = (state && CITIES_BY_STATE[state]) || [];
  // ponytail: the installer profile API has no LGA field yet, so this is held on
  // screen only and not saved. It starts on the city when the city is an LGA.
  const [
    lgaChoice,
    setLgaChoice,
  ] = useState(personal.city ?? "");
  const lga = lgas.includes(lgaChoice) ? lgaChoice : "";

  function onSubmit(values: ProfileDetailsValues) {
    update.mutate(
      { data: values },
      {
        onSuccess: () => toast.success("Profile saved."),
        onError: error => toast.error(error.message),
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={PROFILE_DETAILS_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel required>Phone number</FormLabel>
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
          {/* The sign-in email — only the Platform Admin can change it. */}
          <div className="space-y-2">
            <Label htmlFor="installer-email">Email address</Label>
            <Input
              id="installer-email"
              value={personal.email}
              readOnly
              disabled
            />
          </div>
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>State</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue(
                      "city",
                      "",
                    );
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NIGERIAN_STATES.map(s => (
                      <SelectItem
                        key={s}
                        value={s}
                      >
                        {s}
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
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>City / base location</FormLabel>
                <FormControl>
                  <CityCombobox
                    state={state ?? ""}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label htmlFor="installer-profile-lga">Local Government Area</Label>
            <Select
              value={lga}
              onValueChange={setLgaChoice}
              disabled={!lgas.length}
            >
              <SelectTrigger id="installer-profile-lga">
                <SelectValue placeholder="Select an LGA" />
              </SelectTrigger>
              <SelectContent>
                {lgas.map(l => (
                  <SelectItem
                    key={l}
                    value={l}
                  >
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="submit"
          form={PROFILE_DETAILS_FORM_ID}
          loading={update.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </form>
    </Form>
  );
}
