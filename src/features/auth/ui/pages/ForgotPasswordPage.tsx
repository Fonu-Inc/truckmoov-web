import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "../components/AuthLayout";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { useForgotPassword } from "../../api";

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { mutateAsync: forgotPassword, isPending } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    await forgotPassword(
      {
        data: {
          identifier: values.email,
        },
      },
    );
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your account email and we'll send a 6-digit verification code">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="forgotPasswordEmail" className="text-sm">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="forgotPasswordEmail"
              type="email"
              placeholder="you@company.com"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
          Send Reset Code
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password? <Link to={APP_ROUTES.signIn} className="text-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
