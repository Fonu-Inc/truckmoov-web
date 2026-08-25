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

const invitePasswordSchema = z
  .object({
    fullName: fullNameSchema,
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine(
    values => values.newPassword === values.confirmPassword,
    passwordMismatch,
  );

type InvitePasswordFormValues = z.infer<typeof invitePasswordSchema>;

export const INVITE_PASSWORD_FORM_ID = "admin-invite-password-form";

type InviteProfileFormProps = {
  /** Both come from the invite link's query string; the page gates on them being present. */
  inviteToken: string;
  email: string;
};

export function InviteProfileForm({
  inviteToken, email,
}: InviteProfileFormProps) {
  const navigate = useNavigate();
  const registerInvited = useRegisterInvited();

  const form = useForm<InvitePasswordFormValues>({
    resolver: zodResolver(invitePasswordSchema),
    defaultValues: {
      fullName: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: InvitePasswordFormValues) {
    registerInvited.mutate(
      {
        data: {
          inviteToken,
          fullName: values.fullName.trim(),
          password: values.newPassword,
        },
      },
      {
        onSuccess: () => {
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
        id={INVITE_PASSWORD_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-sm">
          <Mail className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{email}</span>
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="pl-10"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
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
          form={INVITE_PASSWORD_FORM_ID}
          className="w-full"
          loading={registerInvited.isPending}
        >
          Activate account
        </Button>
      </form>
    </Form>
  );
}
