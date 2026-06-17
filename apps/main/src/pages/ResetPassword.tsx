import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { useResetPassword } from "@truckmoov/api/auth";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const RESET_PASSWORD_FORM_ID = "main-reset-password-form";

function PasswordFieldControl({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  autoComplete,
  inputRef,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  placeholder: string;
  autoComplete: string;
  inputRef?: (instance: HTMLInputElement | null) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

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
          autoComplete={autoComplete}
        />
      </FormControl>
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetPassword = useResetPassword();
  const token = searchParams.get("token")?.trim() ?? "";
  const hasToken = token.length > 0;

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    if (!hasToken) {
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
          navigate("/auth", { replace: true });
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!hasToken ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This reset link is invalid or missing its token. Request a new password reset link to continue.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth/forgot-password">
                  Request a new link
                </Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/auth">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form id={RESET_PASSWORD_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
