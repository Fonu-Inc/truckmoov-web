import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@truckmoov/api/auth";
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import {
  ArrowLeft, ArrowRight, Mail, Truck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

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

const forgotPasswordSchema = z.object({ email: z.string().trim().email("Enter a valid email address.") });

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const FORGOT_PASSWORD_FORM_ID = "main-forgot-password-form";

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

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    forgotPassword.mutate(
      { data: { identifier: values.email } },
      {
        onSuccess: () => {
          toast.success("Password reset request completed.");
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

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-3"
        >
          <Link to="/auth">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </Button>

        <div className="text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Reset your password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter the email associated with your account.</p>
        </div>

        <Form {...form}>
          <form
            id={FORGOT_PASSWORD_FORM_ID}
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
                        placeholder="you@example.com"
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

            <Button
              type="submit"
              form={FORGOT_PASSWORD_FORM_ID}
              className="w-full"
              size="lg"
              loading={forgotPassword.isPending}
            >
              <span className="flex items-center gap-2">
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>
        </Form>
      </div>
    </AuthBrandingPanel>
  );
}
