"use client";

import type { UseFormReturn } from "react-hook-form";
import type { VerifyCodeValues } from "@/features/get-started/schemas/verifyCodeSchema";
import {
  InfoRow,
  StepHeading,
} from "@/features/get-started/components/StepParts";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/shadcn/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/shadcn/input-otp";

const LINK_CLASS = "cursor-pointer font-semibold text-brand-deep hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline";

// Verify email / phone: 6 OTP boxes, resend + change-contact links and a
// full-width yellow verify button (Figma "Property 1=Variant…" verify frames).
export function OtpStep({
  form,
  title,
  description,
  onVerify,
  onResend,
  onChangeContact,
  cooldownSeconds,
  isSending,
  isVerifying,
  resendLabel,
  resendPrompt,
  changeLabel,
  changePrompt,
  actionLabel,
}: {
  form: UseFormReturn<VerifyCodeValues>;
  title: string;
  description: React.ReactNode;
  onVerify: (values: VerifyCodeValues) => void;
  onResend: () => void;
  onChangeContact: () => void;
  cooldownSeconds: number;
  isSending: boolean;
  isVerifying: boolean;
  resendPrompt: string;
  resendLabel: string;
  changePrompt: string;
  changeLabel: string;
  actionLabel: string;
}) {
  const resendDisabled = cooldownSeconds > 0 || isSending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onVerify)}
        className="px-0 pt-[38px] sm:px-[17px]"
      >
        <StepHeading
          title={title}
          description={description}
          descriptionClassName="max-w-[400px]"
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem className="mt-[33px]">
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  containerClassName="gap-1"
                >
                  <InputOTPGroup className="gap-1">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        // eslint-disable-next-line react/no-array-index-key -- fixed-length OTP boxes
                        key={index}
                        index={index}
                        className="h-[72px] w-[64px] rounded-[15px] border-border-field bg-field-soft text-lg font-semibold text-heading max-sm:h-14 max-sm:w-12"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <div className="mt-[17px] space-y-3">
          <InfoRow>
            {resendPrompt}
            {" "}
            <button
              type="button"
              onClick={onResend}
              disabled={resendDisabled}
              className={LINK_CLASS}
            >
              {resendDisabled && cooldownSeconds > 0
                ? `${resendLabel} (${cooldownSeconds}s)`
                : resendLabel}
            </button>
          </InfoRow>
          <InfoRow>
            {changePrompt}
            {" "}
            <button
              type="button"
              onClick={onChangeContact}
              className={LINK_CLASS}
            >
              {changeLabel}
            </button>
          </InfoRow>
        </div>
        <button
          type="submit"
          disabled={!form.formState.isValid || isVerifying}
          className="mt-[81px] flex h-[45px] w-full cursor-pointer items-center justify-center rounded-[12px] border-[0.2px] border-brand-deep/20 bg-primary text-sm font-medium text-heading shadow-button transition-[background-color,opacity] hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary sm:-ml-[3px] sm:w-[calc(100%+6px)]"
        >
          {isVerifying ? "Verifying…" : actionLabel}
        </button>
      </form>
    </Form>
  );
}
