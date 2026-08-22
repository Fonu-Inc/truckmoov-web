import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPassword } from "@truckmoov/api/auth";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import {
  confirmPasswordSchema, newPasswordSchema, passwordMismatch,
} from "@/features/auth/utils/schemas";

const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine(
    values => values.newPassword === values.confirmPassword,
    passwordMismatch,
  );

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const RESET_PASSWORD_FORM_ID = "main-reset-password-form";

/** `token` comes from the reset link's query string; the page renders its empty state when absent. */
export function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      toast.error("Reset link is missing a token.");
      return;
    }

    resetPassword.mutate(
      {
        data: {
          token,
          newPassword: values.newPassword,
        },
      },
      {
        onSuccess: () => {
          toast.success("Password reset completed.");
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
        id={RESET_PASSWORD_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
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
              <FormLabel>Confirm new password</FormLabel>
              <PasswordFieldControl
                placeholder="Repeat your new password"
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
          form={RESET_PASSWORD_FORM_ID}
          className="w-full"
          loading={resetPassword.isPending}
        >
          Update password
        </Button>
      </form>
    </Form>
  );
}
