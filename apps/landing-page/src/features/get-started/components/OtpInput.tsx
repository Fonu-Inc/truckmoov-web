"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/shadcn/input-otp";

const SLOTS = [
  0,
  1,
  2,
  3,
  4,
  5,
];

// Six OTP boxes in the Figma verify-step style.
export function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      containerClassName="gap-1"
    >
      <InputOTPGroup className="gap-1">
        {SLOTS.map(index => (
          <InputOTPSlot
            key={index}
            index={index}
            className="h-[72px] w-[64px] rounded-[15px] border-border-field bg-field-soft text-lg font-semibold text-heading max-sm:h-14 max-sm:w-12"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
