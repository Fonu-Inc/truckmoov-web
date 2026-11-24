import { zodResolver } from "@hookform/resolvers/zod";
import {
  isTwoFactorChallenge, useLogin,
} from "@truckmoov/api/auth";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import {
  ArrowRight, Mail,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link, useNavigate,
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
import { useAuthStore } from "@/features/auth/stores/authStore";
import { resolvePostLoginPath } from "@/features/auth/utils/authRedirect";
import { emailSchema } from "@/features/auth/utils/schemas";

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(
    1,
    "Password is required.",
  ),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export const SIGN_IN_FORM_ID = "main-sign-in-form";

export function SignInForm({ onChallenge }: { onChallenge: (challengeToken: string) => void }) {
  const navigate = useNavigate();
  const login = useLogin();
  // The mutation settles before resolvePostLoginPath (GET /auth/two-factor) returns, so track that gap too.
  const [
    isResolving,
    setIsResolving,
  ] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: SignInFormValues) {
    login.mutate(
      {
        data: {
          email: values.email,
          password: values.password,
        },
      },
      {
        onSuccess: async (res) => {
          // TRU-FE-23 — two-factor on: no session yet, the code step takes over.
          if (isTwoFactorChallenge(res.data)) {
            onChallenge(res.data.challengeToken);
            return;
          }
          // Resolve before syncing: once the store says "authenticated", AuthGuard redirects off /auth on its own.
          setIsResolving(true);
          const to = await resolvePostLoginPath(res.data.user.role);
          useAuthStore.getState().syncFromSession();
          toast.success("Login request completed.");
          navigate(
            to,
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
        id={SIGN_IN_FORM_ID}
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
                    placeholder="you@company.com"
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
                placeholder="Password"
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
          form={SIGN_IN_FORM_ID}
          className="w-full"
          size="lg"
          loading={login.isPending || isResolving}
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
