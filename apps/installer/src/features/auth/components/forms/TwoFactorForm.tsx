import { zodResolver } from "@hookform/resolvers/zod";
import { useInstallerLoginTwoFactor } from "@truckmoov/api/auth";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/shadcn/input-otp";
import { useAuthStore } from "@/stores/authStore";

// ponytail: one schema for both modes — the server is the judge of a code; this only stops an empty submit.
const twoFactorSchema = z.object({
  code: z.string().trim().min(
    1,
    "Enter a code.",
  ),
});

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

export const TWO_FACTOR_FORM_ID = "installer-two-factor-form";

// The server's wording for an expired, used, forged or other portal's challenge (TRU-FE-18).
const EXPIRED = /sign-in has expired/i;

type TwoFactorFormProps = {
  challengeToken: string;
  /** Back to the password step — the challenge is spent or expired. */
  onRestart: () => void;
};

/**
 * Second step of installer sign-in. The challenge lasts five minutes and works
 * once; so does each recovery code. A wrong code leaves the challenge usable.
 */
export function TwoFactorForm({
  challengeToken, onRestart,
}: TwoFactorFormProps) {
  const navigate = useNavigate();
  const verify = useInstallerLoginTwoFactor();
  const [
    useRecovery,
    setUseRecovery,
  ] = useState(false);

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  function toggleMode() {
    setUseRecovery(v => !v);
    form.reset({ code: "" });
  }

  function onSubmit(values: TwoFactorFormValues) {
    verify.mutate(
      {
        data: {
          challengeToken,
          code: values.code.trim(),
        },
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().bootstrapFromSession();
          navigate(
            "/",
            { replace: true },
          );
        },
        onError: (error) => {
          if (error.statusCode === 401 && EXPIRED.test(error.message)) {
            toast.error("This sign-in has expired. Enter your password again.");
            onRestart();
            return;
          }
          if (error.statusCode === 404) {
            toast.error("This account can't sign in to the installer portal.");
            onRestart();
            return;
          }
          // "That code is not valid", or the 429 cooldown — its message already names the wait.
          form.setError(
            "code",
            { message: error.message },
          );
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={TWO_FACTOR_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{useRecovery ? "Recovery code" : "Authenticator code"}</FormLabel>
              {useRecovery
                ? (
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="xxxx-xxxx"
                          className="pl-10"
                          autoComplete="one-time-code"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                    </div>
                  )
                : (
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        autoFocus
                        autoComplete="one-time-code"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      >
                        <InputOTPGroup>
                          {[
                            0,
                            1,
                            2,
                          ].map(index => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                            />
                          ))}
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          {[
                            3,
                            4,
                            5,
                          ].map(index => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          form={TWO_FACTOR_FORM_ID}
          className="w-full"
          size="lg"
          loading={verify.isPending}
        >
          Verify
        </Button>

        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-primary hover:underline"
          >
            {useRecovery ? "Use authenticator code" : "Use a recovery code"}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="text-muted-foreground hover:underline"
          >
            Start again
          </button>
        </div>
      </form>
    </Form>
  );
}
