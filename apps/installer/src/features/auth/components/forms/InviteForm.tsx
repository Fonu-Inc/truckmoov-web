import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterInvited } from "@truckmoov/api/auth";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import {
  Mail, User,
} from "lucide-react";
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
import { Input } from "@/components/shadcn/input";
import {
  confirmPasswordSchema, newPasswordSchema, passwordMismatch,
} from "@/features/auth/utils/schemas";
import { useAuthStore } from "@/stores/authStore";

const inviteSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine(
    values => values.newPassword === values.confirmPassword,
    passwordMismatch,
  );

type InviteFormValues = z.infer<typeof inviteSchema>;

export const INVITE_FORM_ID = "installer-invite-form";

type InviteFormProps = {
  inviteToken: string;
  /** From GET /auth/invite/validate — shown, not editable: the invite is bound to it. */
  email: string;
  /** The name the installer was invited under, shown as it will appear to customers. */
  fullName?: string | null;
};

/**
 * Finishes the invite with POST /auth/register/invited, then sends the
 * installer to sign in — through /auth/installer/login, so two-factor and the
 * installer-only gate apply from the very first session.
 */
export function InviteForm({
  inviteToken, email, fullName,
}: InviteFormProps) {
  const navigate = useNavigate();
  const registerInvited = useRegisterInvited();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: InviteFormValues) {
    registerInvited.mutate(
      {
        data: {
          inviteToken,
          password: values.newPassword,
        },
      },
      {
        onSuccess: async () => {
          // Whoever was signed in on this browser is not the person who just activated.
          await useAuthStore.getState().logout();
          toast.success("Account activated. Sign in to continue.");
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
        id={INVITE_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormItem>
          <FormLabel>Email</FormLabel>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              className="pl-10"
              readOnly
              disabled
            />
          </div>
        </FormItem>

        {fullName && (
          <FormItem>
            <FormLabel>Full name</FormLabel>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={fullName}
                className="pl-10"
                readOnly
                disabled
              />
            </div>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Password</FormLabel>
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
              <FormLabel required>Confirm password</FormLabel>
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
          form={INVITE_FORM_ID}
          className="w-full"
          loading={registerInvited.isPending}
        >
          Activate account
        </Button>
      </form>
    </Form>
  );
}
