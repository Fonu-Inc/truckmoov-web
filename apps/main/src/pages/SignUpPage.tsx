import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@truckmoov/api/auth";
import { useAuthStore as useApiAuthStore } from "@truckmoov/api/lib/auth-store";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import {
  ArrowRight, Building2, Mail, Truck, User,
} from "lucide-react";
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
import { useAuthStore } from "@/stores/authStore";

const signUpSchema = z
  .object({
    firstName: z.string().trim().min(
      1,
      "First name is required.",
    ),
    lastName: z.string().trim().min(
      1,
      "Last name is required.",
    ),
    organizationName: z.string().trim().min(
      1,
      "Organization name is required.",
    ),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(
      8,
      "Password must be at least 8 characters.",
    ),
    confirmPassword: z.string().min(
      1,
      "Confirm your password.",
    ),
  })
  .refine(
    values => values.password === values.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

type SignUpFormValues = z.infer<typeof signUpSchema>;

export const SIGN_UP_FORM_ID = "main-sign-up-form";

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

export default function SignUpPage() {
  const navigate = useNavigate();
  const register = useRegister();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      organizationName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: SignUpFormValues) {
    register.mutate(
      {
        data: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          organizationName: values.organizationName,
          password: values.password,
        },
      },
      {
        onSuccess: (res) => {
          useApiAuthStore.getState().setSession(res.data);
          useAuthStore.getState().syncFromSession();
          toast.success("Registration request completed.");
          navigate(
            "/overview",
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
    <AuthBrandingPanel helpMode="sign-up">
      <div className="w-full max-w-sm space-y-6">
        <MobileLogo />

        <div className="text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start managing your fleet today</p>
        </div>

        <Form {...form}>
          <form
            id={SIGN_UP_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="John"
                          className="pl-10"
                          autoComplete="given-name"
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="pl-10"
                          autoComplete="family-name"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="Your Company Ltd"
                        className="pl-10"
                        autoComplete="organization"
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
                  <FormLabel>Confirm Password</FormLabel>
                  <PasswordFieldControl
                    placeholder="Confirm your password"
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
              form={SIGN_UP_FORM_ID}
              className="w-full"
              size="lg"
              loading={register.isPending}
            >
              <span className="flex items-center gap-2">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?
          {" "}
          <Link
            to="/auth"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthBrandingPanel>
  );
}
