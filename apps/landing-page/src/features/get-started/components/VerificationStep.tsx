"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import { OtpInput } from "@/features/get-started/components/OtpInput";
import {
  InfoRow,
  Spinner,
  StepHeading,
  StepLayout,
  SuccessMark,
} from "@/features/get-started/components/StepParts";
import { LINK_CLASS } from "@/features/get-started/utils/getStartedContent";

/**
 * Email / phone code entry (main app: VerificationStep). The code is checked as soon as
 * all six digits are in; the parent owns the send / verify API calls.
 */
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
}: {
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
}) {
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

  const verify = useEffectEvent((value: string) => {
    verifyingRef.current = true;
    setChecking(true);
    void onVerify(value)
      .then((ok) => {
        if (!ok)
          setCode("");
      })
      .finally(() => {
        verifyingRef.current = false;
        setChecking(false);
      });
  });

  // Auto-verify as soon as all six digits are in.
  useEffect(
    () => {
      if (code.length === 6 && !verified && !verifyingRef.current)
        verify(code);
    },
    [
      code,
      verified,
    ],
  );

  const label = isEmail ? "email address" : "phone number";

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          continueLabel="Next"
          continueDisabled={!verified}
          onContinue={onNext}
        />
      )}
    >
      {verified
        ? (
            <div
              className="flex flex-col items-center text-center"
              role="status"
            >
              <SuccessMark className="mt-[90px]" />
              <h2 className="mt-[21px] text-[20px] leading-[25px] font-semibold text-heading">
                {isEmail ? "Email address verified" : "Phone number verified"}
              </h2>
              <p className="mt-[3px] text-sm leading-5 text-heading">{destination}</p>
            </div>
          )
        : (
            <div className="sm:px-[17px]">
              <StepHeading
                title={isEmail ? "Check your inbox" : "Check your messages"}
                description={(
                  <>
                    We sent a 6-digit code to
                    {" "}
                    <span className="font-semibold text-heading">{destination || `your ${label}`}</span>
                    . Enter it below to continue.
                  </>
                )}
                descriptionClassName="max-w-[420px]"
              />
              <div className="mt-[33px]">
                <OtpInput
                  value={code}
                  onChange={setCode}
                  disabled={checking}
                />
              </div>
              <div
                role="status"
                aria-live="polite"
              >
                {(checking || sending) && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-3.5 border-2" />
                    {checking ? "Verifying…" : `Sending a code to your ${label}…`}
                  </p>
                )}
              </div>
              <InfoRow className="mt-[17px]">
                Didn't receive it?
                {" "}
                <button
                  type="button"
                  onClick={onSend}
                  disabled={sending || cooldown > 0}
                  className={LINK_CLASS}
                >
                  {sending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </InfoRow>
            </div>
          )}
    </StepLayout>
  );
}
