import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@truckmoov/api/auth";
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import {
  ArrowRight, Car, ChevronDown, Eye, EyeOff, Factory, Headphones, Lock, Mail, Network, Settings, Sparkles, Truck, Users, Wrench,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link, useNavigate,
} from "react-router-dom";

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
import { getPostLoginRedirectPath } from "@/lib/authRedirect";
import { useAuthStore } from "@/stores/authStore";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(
    1,
    "Password is required.",
  ),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export const SIGN_IN_FORM_ID = "main-sign-in-form";

function MobileLogo() {
  return (
    <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-mtn">
        <Truck className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-foreground">FleetPro</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">Enterprise Fleet</span>
      </div>
    </div>
  );
}

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
          autoComplete="current-password"
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

export default function AuthPage() {
  const navigate = useNavigate();
  const login = useLogin();

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
        onSuccess: (res) => {
          useAuthStore.getState().syncFromSession();
          toast.success("Login request completed.");
          navigate(
            getPostLoginRedirectPath(res.data.user.role),
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
    <AuthBrandingPanel helpMode="sign-in">
      <div className="w-full max-w-sm space-y-6">
        <MobileLogo />

        <div className="text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your FleetPro account</p>
        </div>

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
                  <FormLabel>Email</FormLabel>
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
                    <FormLabel>Password</FormLabel>
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
              loading={login.isPending}
            >
              <span className="flex items-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          New to FleetPro?
          {" "}
          <Link
            to="/auth/signup"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthBrandingPanel>
  );
}
