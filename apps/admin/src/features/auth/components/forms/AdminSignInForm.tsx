import type {
  TwoFactorChallenge, TwoFactorEnrolmentChallenge,
} from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  isTwoFactorChallenge, useSystemLogin,
} from "@truckmoov/api/auth";
import { returnPathFromState } from "@truckmoov/app-core/utils/general-utils";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import {
  ArrowRight, Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  useLocation, useNavigate,
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
import { useAuthStore } from "@/stores/authStore";

const adminSignInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(
    1,
    "Password is required.",
  ),
});

type AdminSignInFormValues = z.infer<typeof adminSignInSchema>;

export const ADMIN_SIGN_IN_FORM_ID = "admin-sign-in-form";

export function AdminSignInForm({ onChallenge }: { onChallenge: (challenge: TwoFactorChallenge | TwoFactorEnrolmentChallenge) => void }) {
  const systemLogin = useSystemLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<AdminSignInFormValues>({
    resolver: zodResolver(adminSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: AdminSignInFormValues) {
    systemLogin.mutate(
      {
        data: {
          email: values.email,
          password: values.password,
        },
      },
      {
        onSuccess: async (res) => {
          // TRU-FE-23 — two-factor on (or required): no session yet, the code or enrolment step takes over.
          if (isTwoFactorChallenge(res.data)) {
            onChallenge(res.data);
            return;
          }
          await useAuthStore.getState().bootstrapFromSession();
          toast.success("System login request completed.");
          navigate(
            returnPathFromState(location.state) ?? "/",
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
        id={ADMIN_SIGN_IN_FORM_ID}
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
                    placeholder="admin@company.com"
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
              <FormLabel required>Password</FormLabel>
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
          form={ADMIN_SIGN_IN_FORM_ID}
          className="w-full"
          size="lg"
          loading={systemLogin.isPending}
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
