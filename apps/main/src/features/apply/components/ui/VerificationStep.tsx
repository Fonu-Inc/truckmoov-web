import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Smartphone,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";

import { Button } from "@/components/shadcn/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/shadcn/input-otp";
import { ApplicationSaveButton } from "@/features/apply/components/ui/ApplicationSaveButton";

type VerificationStepProps = {
  channel: "email" | "phone";
  /** Masked by the server when available, otherwise what the applicant typed. */
  destination: string;
  verified: boolean;
  sending: boolean;
  /** Seconds left before another code may be requested. */
  cooldown: number;
  onSend: () => void;
  onVerify: (code: string) => Promise<boolean>;
  onBack: () => void;
  onNext: () => void;
};

export function VerificationStep({
  channel,
  destination,
  verified,
  sending,
  cooldown,
  onSend,
  onVerify,
  onBack,
  onNext,
}: VerificationStepProps) {
  const isEmail = channel === "email";
  const [
    code,
    setCode,
  ] = useState("");
  const [
    checking,
    setChecking,
  ] = useState(false);
  const verifyingRef = useRef(false);

  const Icon = isEmail ? Mail : Smartphone;
  const label = isEmail ? "email address" : "phone number";

  // Auto-verify as soon as all six digits are in, like the design app.
  useEffect(
    () => {
      if (code.length !== 6 || verified || verifyingRef.current)
        return;

      verifyingRef.current = true;
      setChecking(true);
      void onVerify(code)
        .then((ok) => {
          if (!ok)
            setCode("");
        })
        .finally(() => {
          verifyingRef.current = false;
          setChecking(false);
        });
    },
    // ponytail: fires on the code reaching six digits, not on every onVerify identity change.
    // eslint-disable-next-line react/exhaustive-deps
    [
      code,
      verified,
    ],
  );

  return (
    <div className="space-y-8">
      {verified
        ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isEmail ? "Email address verified" : "Phone number verified"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{destination}</p>
              </div>
            </div>
          )
        : (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </div>

              <div className="max-w-sm">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {isEmail ? "Check your inbox" : "Check your messages"}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  We sent a 6-digit code to
                  {" "}
                  <span className="font-medium text-foreground">
                    {destination || `your ${label}`}
                  </span>
                  . Enter it below to continue.
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  disabled={checking}
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

                <div
                  role="status"
                  aria-live="polite"
                >
                  {(checking || sending) && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {checking ? "Verifying…" : `Sending a code to your ${label}…`}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Didn't receive it?
                {" "}
                <button
                  type="button"
                  onClick={onSend}
                  disabled={sending || cooldown > 0}
                  className="font-medium text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                >
                  {sending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </p>
            </div>
          )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ApplicationSaveButton />
        <Button
          size="lg"
          className="min-w-40"
          onClick={onNext}
          disabled={!verified}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
