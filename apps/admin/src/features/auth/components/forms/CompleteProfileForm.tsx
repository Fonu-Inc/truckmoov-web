import { zodResolver } from "@hookform/resolvers/zod";
import { useCompleteProfile } from "@truckmoov/api/auth";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
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
  confirmPasswordSchema, fullNameSchema, newPasswordSchema, passwordMismatch,
} from "@/features/auth/utils/schemas";

const completeProfileSchema = z
  .object({
    fullName: fullNameSchema,
    password: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine(
    values => values.password === values.confirmPassword,
    passwordMismatch,
  );

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export const COMPLETE_PROFILE_FORM_ID = "admin-complete-profile-form";

/** `token` comes from the verify-email hop; the page renders its empty state when absent. */
export function CompleteProfileForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const completeProfile = useCompleteProfile();

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: CompleteProfileFormValues) {
    if (!token) {
      toast.error("Profile link is missing a token.");
      return;
    }

    completeProfile.mutate(
      {
        data: {
          token,
          fullName: values.fullName,
          password: values.password,
        },
      },
      {
        onSuccess: () => {
          toast.success("Profile completed. Sign in to continue.");
          navigate(
            "/auth",
            { replace: true },
          );
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={COMPLETE_PROFILE_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <PasswordFieldControl
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <PasswordFieldControl
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          form={COMPLETE_PROFILE_FORM_ID}
          className="w-full"
          loading={completeProfile.isPending}
        >
          Complete profile
        </Button>
      </form>
    </Form>
  );
}
