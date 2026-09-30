import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { cooldownSeconds, useCooldown } from "./twoFactorUtils";

// The server's wording for an expired, used, forged or other portal's challenge.
const EXPIRED = /sign-in has expired/i;

export const TWO_FACTOR_CODE_FORM_ID = "two-factor-code-form";

type TwoFactorCodeFormProps = {
  /** Sends the code to this portal's `/login/two-factor`; rejects with a ServerErrorResponse. */
  verify: (code: string) => Promise<unknown>;
  /** Back to the password step — the challenge is spent or expired. */
  onRestart: () => void;
  /** Recovery codes only exist after setup; the admin enrolment step has none yet. */
  allowRecovery?: boolean;
  submitLabel?: string;
};

/**
 * TRU-FE-23 — the code step of every portal's sign-in. The challenge lasts five minutes and works
 * once; so does each recovery code. A wrong code, or the cooldown after three of them, keeps the
 * challenge — only an expired one sends the user back to the password step.
 */
export function TwoFactorCodeForm({
  verify, onRestart, allowRecovery = true, submitLabel = "Verify",
}: TwoFactorCodeFormProps) {
  const [useRecovery, setUseRecovery] = useState(false);
  const [pending, setPending] = useState(false);
  const cooldown = useCooldown();
  const form = useForm<{ code: string }>({ defaultValues: { code: "" } });
  const waiting = cooldown.secondsLeft > 0;

  function toggleMode() {
    setUseRecovery(v => !v);
    form.reset({ code: "" });
  }

  async function onSubmit({ code }: { code: string }) {
    setPending(true);
    try {
      await verify(code.trim());
    }
    catch (e) {
      const error = e as ServerErrorResponse;
      if (error.statusCode === 401 && EXPIRED.test(error.message)) {
        toast.error("This sign-in has expired. Enter your password again.");
        onRestart();
        return;
      }
      if (error.statusCode === 404) {
        toast.error(error.message);
        onRestart();
        return;
      }
      const wait = cooldownSeconds(error);
      if (wait !== null) {
        cooldown.start(wait);
        form.clearErrors("code");
        return;
      }
      // "That code is not valid", or the per-IP limit — the server's message says which.
      form.setError("code", { message: error.message });
    }
    finally {
      setPending(false);
    }
  }

  return (
    <Form {...form}>
      <form
        id={TWO_FACTOR_CODE_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="code"
          rules={{ validate: v => v.trim().length > 0 || "Enter a code." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{useRecovery ? "Recovery code" : "Authenticator code"}</FormLabel>
              {useRecovery
                ? (
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="xxxxx-xxxxx"
                          className="pl-10"
                          autoComplete="one-time-code"
                          autoFocus
                          disabled={waiting}
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
                        disabled={waiting}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      >
                        <InputOTPGroup>
                          {[0, 1, 2].map(i => <InputOTPSlot key={i} index={i} />)}
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          {[3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  )}
              <FormMessage />
              {waiting
                ? (
                    <p role="status" className="text-sm text-destructive">
                      {`Too many wrong codes. Try again in ${cooldown.secondsLeft}s.`}
                    </p>
                  )
                : null}
            </FormItem>
          )}
        />

        <Button
          type="submit"
          form={TWO_FACTOR_CODE_FORM_ID}
          className="w-full"
          size="lg"
          loading={pending}
          disabled={waiting}
        >
          {waiting ? `Try again in ${cooldown.secondsLeft}s` : submitLabel}
        </Button>

        <div className="flex items-center justify-between gap-3 text-xs">
          {allowRecovery
            ? (
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-primary hover:underline"
                >
                  {useRecovery ? "Use authenticator code" : "Use a recovery code"}
                </button>
              )
            : <span />}
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
