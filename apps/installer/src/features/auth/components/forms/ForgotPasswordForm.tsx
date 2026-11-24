import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@truckmoov/api/auth";
import {
  ArrowRight, Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
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

const forgotPasswordSchema = z.object({ email: emailSchema });

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const FORGOT_PASSWORD_FORM_ID = "installer-forgot-password-form";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    // The API takes `identifier`, not `email`.
    forgotPassword.mutate(
      { data: { identifier: values.email } },
      {
        onSuccess: () => {
          toast.success("If that email has an account, a reset link is on its way.");
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
        id={FORGOT_PASSWORD_FORM_ID}
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
  );
}
