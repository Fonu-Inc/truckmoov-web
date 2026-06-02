import { useState } from "react";
import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { useSystemLogin } from "@truckmoov/api/auth";
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
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";

const adminSignInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type AdminSignInFormValues = z.infer<typeof adminSignInSchema>;

export const ADMIN_SIGN_IN_FORM_ID = "admin-sign-in-form";

function MobileLogo() {
  return (
    <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-mtn">
        <Truck className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-foreground">FleetPro</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">Platform Admin</span>
      </div>
    </div>
  );
}

function PasswordFieldControl({
  value,
  onChange,
  onBlur,
  name,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <FormControl>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          className="pl-10 pr-10"
          autoComplete="current-password"
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

export default function AuthPage() {
  const systemLogin = useSystemLogin();

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
          password: values.password
        }
      },
      {
        onSuccess: () => {
          toast.success("System login request completed.");
        },
        onError: (error) => {
          toast.error(error.message || "System login request failed.");
        },
      },
    );
  }

  return (
    <AuthBrandingPanel helpMode="sign-in">
      <div className="w-full max-w-sm space-y-6">
        <MobileLogo />

        <div className="text-left">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Platform admin sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage platform operations.</p>
        </div>

        <Form {...form}>
          <form id={ADMIN_SIGN_IN_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input type="email" placeholder="admin@company.com" className="pl-10" autoComplete="email" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <PasswordFieldControl {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" form={ADMIN_SIGN_IN_FORM_ID} className="w-full" size="lg" loading={systemLogin.isPending}>
              <span className="flex items-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>
        </Form>
      </div>
    </AuthBrandingPanel>
  );
}
