import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useLogin, useSystemChangePassword,
} from "@truckmoov/api/auth";
import {
  ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link, useSearchParams,
} from "react-router-dom";

import * as z from "zod";
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

const invitePasswordSchema = z
  .object({
    newPassword: z.string().min(
      8,
      "Password must be at least 8 characters.",
    ),
    confirmPassword: z.string().min(
      1,
      "Confirm your password.",
    ),
  })
  .refine(
    values => values.newPassword === values.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

type InvitePasswordFormValues = z.infer<typeof invitePasswordSchema>;

export const INVITE_PASSWORD_FORM_ID = "main-invite-password-form";

function PasswordFieldControl({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  placeholder: string;
  inputRef?: (instance: HTMLInputElement | null) => void;
}) {
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <FormControl>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          ref={inputRef}
          className="pl-10 pr-10"
          autoComplete="new-password"
        />
      </FormControl>
      <button
        type="button"
        onClick={() => setShowPassword(current => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const changePassword = useSystemChangePassword();

  const inviteToken = searchParams.get("invite")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";
  const hasInvite = inviteToken.length > 0 && email.length > 0;

  const isSubmitting = login.isPending || changePassword.isPending;

  const form = useForm<InvitePasswordFormValues>({
    resolver: zodResolver(invitePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: InvitePasswordFormValues) {
    await changePassword.mutateAsync({
      data: {
        currentPassword: inviteToken,
        newPassword: values.newPassword,
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Choose a password to finish activating your FleetPro account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!hasInvite
            ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    This invitation link is incomplete. Open the link from your invitation email again, or ask your
                    admin to resend the invitation.
                  </p>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full"
                  >
                    <Link to="/auth">
                      <ArrowLeft className="h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              )
            : (
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
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <PasswordFieldControl
                            placeholder="At least 8 characters"
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
                      loading={isSubmitting}
                    >
                      Set password and sign in
                    </Button>
                  </form>
                </Form>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
