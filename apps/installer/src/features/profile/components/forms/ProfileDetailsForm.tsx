import type { InstallerProfile } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  NIGERIAN_STATES,
  useUpdateInstallerProfile,
} from "@truckmoov/api/auth";
import { Save } from "lucide-react";
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
                <FormLabel>First name</FormLabel>
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
                <FormLabel>Last name</FormLabel>
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
                <FormLabel>Phone number</FormLabel>
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
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
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
              <FormItem className="sm:col-span-2">
                <FormLabel>City / base location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
