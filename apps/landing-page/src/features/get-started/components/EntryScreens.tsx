"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  ArrowCounterClockwise,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { useResumeOnboardingApplication } from "@truckmoov/api/auth";
import { useState } from "react";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  InfoRow,
  Notice,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import {
  FIELD_CLASS,
  LABEL_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]{2,}$/;

/**
 * "Apply as Returning Customer" with nothing saved in this browser: email a resume link
 * (the same call as the main app's "Save & Continue Later").
 */
export function ResumeByEmailScreen({
  onStartNew,
  onClose,
}: {
  onStartNew: () => void;
  onClose: () => void;
}) {
  const resume = useResumeOnboardingApplication();
  const [
    email,
    setEmail,
  ] = useState("");
  const [
    sent,
    setSent,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const valid = EMAIL_SHAPE.test(email.trim());

  async function send() {
    setError(null);
    try {
      await resume.mutateAsync({ data: { businessEmail: email.trim() } });
      // The reply is the same whether or not an application exists, so never branch on it.
      setSent(true);
    }
    catch (err) {
      setError((err as ServerErrorResponse).message || "We couldn't send the link. Try again.");
    }
  }

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onClose}
          backLabel="Close"
          continueLabel={sent ? "Send again" : "Email me a link"}
          continueLoading={resume.isPending}
          continueDisabled={!valid}
          onContinue={() => void send()}
        />
      )}
    >
      <StepHeading
        title="Continue your application"
        description="We Couldn't Find A Saved Application In This Browser. Enter The Business Email You Applied With And We'll Send You A Link To Pick Up Where You Stopped."
      />
      <form
        className="mt-[30px] space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid)
            void send();
        }}
      >
        <label className="block space-y-1.5">
          <span className={LABEL_CLASS}>Business Email</span>
          <input
            type="email"
            value={email}
            placeholder="operations@company.com"
            className={FIELD_CLASS}
            onChange={(event) => {
              setEmail(event.target.value);
              setSent(false);
            }}
          />
        </label>
        {sent && (
          <Notice tone="success">
            If your business email is verified, we've sent you a link to continue your application.
          </Notice>
        )}
        {error && <Notice>{error}</Notice>}
        <InfoRow className="text-xs text-muted-foreground">
          Haven't applied yet?
          {" "}
          <button
            type="button"
            className="cursor-pointer font-semibold text-brand-deep hover:underline"
            onClick={onStartNew}
          >
            Start a new application
          </button>
        </InfoRow>
      </form>
    </StepLayout>
  );
}

/** "Apply for Account Creation" while an application is saved in this browser. */
export function DraftChoiceScreen({
  onContinue,
  onStartNew,
  onClose,
}: {
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
}) {
  const options = [
    {
      key: "continue",
      title: "Continue my application",
      description: "Pick up on the step you stopped at.",
      icon: ArrowCounterClockwise,
      onSelect: onContinue,
    },
    {
      key: "new",
      title: "Start a new application",
      description: "Discard the saved application in this browser and start again.",
      icon: Plus,
      onSelect: onStartNew,
    },
  ];

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onClose}
          backLabel="Close"
        />
      )}
    >
      <StepHeading
        title="You have an application in progress"
        description="We Saved Your Progress In This Browser. Continue Where You Stopped, Or Start A New Application."
      />
      <div className="mt-[30px] grid gap-[9px] sm:grid-cols-2">
        {options.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={option.onSelect}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-3 rounded-[20px] border-[0.5px] border-border bg-background p-5 text-left transition-colors hover:border-brand-bright",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-[12px] bg-brand-tint">
              <option.icon className="size-5 text-brand-deep" />
            </span>
            <span className="text-base leading-5 font-semibold text-heading">{option.title}</span>
            <span className="text-xs leading-[17px] text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
