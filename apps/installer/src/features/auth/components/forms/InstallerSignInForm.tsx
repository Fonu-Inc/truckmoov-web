import type { TwoFactorChallenge } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInstallerLogin } from "@truckmoov/api/auth";
import { returnPathFromState } from "@truckmoov/app-core/utils/general-utils";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import {
  ArrowRight, Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Link, useLocation, useNavigate,
} from "react-router";
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
import { emailSchema } from "@/features/auth/utils/schemas";
import { useAuthStore } from "@/stores/authStore";

const installerSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(
    1,
    "Password is required.",
  ),
});

type InstallerSignInFormValues = z.infer<typeof installerSignInSchema>;

export const INSTALLER_SIGN_IN_FORM_ID = "installer-sign-in-form";

type InstallerSignInFormProps = {
  /** An installer with two-factor on gets a challenge instead of a session. */
  onChallenge: (challenge: TwoFactorChallenge) => void;
};

/**
 * Posts to `/auth/installer/login` (TRU-FE-18), not `/auth/login`: only the
 * installer route admits installers and issues the two-factor challenge. A
 * non-installer, suspended or unverified account is answered with a 404.
 */
export function InstallerSignInForm({ onChallenge }: InstallerSignInFormProps) {
  const login = useInstallerLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<InstallerSignInFormValues>({
    resolver: zodResolver(installerSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: InstallerSignInFormValues) {
    login.mutate(
      {
        data: {
          email: values.email,
          password: values.password,
        },
      },
      {
        onSuccess: async (res) => {
          if ("twoFactorRequired" in res.data) {
            onChallenge(res.data);
            return;
          }
          await useAuthStore.getState().bootstrapFromSession();
          navigate(
            returnPathFromState(location.state) ?? "/",
            { replace: true },
          );
        },
        onError: (error) => {
          toast.error(error.statusCode === 404
            ? "This account can't sign in to the installer portal."
            : error.message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={INSTALLER_SIGN_IN_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Email</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    placeholder="installer@company.com"
                    className="pl-10"
                    autoComplete="email"
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-3">
                <FormLabel required>Password</FormLabel>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordFieldControl
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
          form={INSTALLER_SIGN_IN_FORM_ID}
          className="w-full"
          size="lg"
          loading={login.isPending}
        >
          <span className="flex items-center gap-2">
            Sign In
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </form>
    </Form>
  );
}
