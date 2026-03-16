import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { useVerifyPasswordReset } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import AuthLayout from "../components/AuthLayout";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

const verifyResetSchema = z.object({
  otp: z.string().trim().length(6, "Enter the 6-digit code"),
});

type VerifyResetFormValues = z.infer<typeof verifyResetSchema>;

export default function VerifyResetTokenPage() {
  const navigate = useNavigate();
  const { mutateAsync: verifyResetCode, isPending } = useVerifyPasswordReset();
  const {
    control,
    handleSubmit,
    formState: { errors, },
  } = useForm<VerifyResetFormValues>({
    resolver: zodResolver(verifyResetSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (values: VerifyResetFormValues) => {
    await verifyResetCode(
      {
        data: {
          token: values.otp,
        },
      },
      {
        onSuccess: (data) => {
          const nextToken = data.data;

          navigate(`${APP_ROUTES.change}?token=${nextToken}`);
        },
      }
    );
  };

  return (
    <AuthLayout
      title="Verify reset code"
      subtitle="Enter the 6-digit code sent to your email"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5 flex flex-col items-center w-full">
          <Controller
            control={control}
            name="otp"
            render={({ field }) => (
              <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={field.value} onChange={field.onChange}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
          {errors.otp && <p className="text-xs text-destructive">{errors.otp.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isPending} disabled={isPending}>
          Verify Code
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Need another code? <Link to={APP_ROUTES.forgetPassword} className="text-primary font-semibold hover:underline">Start again</Link>
      </p>
    </AuthLayout>
  );
}
