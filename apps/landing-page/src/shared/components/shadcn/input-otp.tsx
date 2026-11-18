"use client";

import {
  OTPInput, OTPInputContext,
} from "input-otp";
import { Minus } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-3 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn(
        "disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

function InputOTPGroup({
  className, ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center gap-3",
        className,
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  // ponytail: cast — input-otp ships its own @types/react context and pnpm's
  // hoisting picks a mismatched version. Drop the cast once the workspace
  // consolidates @types/react.
  const inputOTPContext = React.useContext(OTPInputContext as unknown as React.Context<{
    slots: Array<{
      char: string | null; hasFakeCaret: boolean; isActive: boolean;
    }>;
  }>);
  const {
    char, hasFakeCaret, isActive,
  } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-20 w-17 items-center justify-center rounded-2xl border border-border-100 bg-[#F7F7F7] text-lg font-bold text-foreground outline-none transition-colors",
        "data-[active=true]:border-primary data-[active=true]:z-10",
        "aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      {...props}
    >
      <Minus />
    </div>
  );
}

export {
  InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,
};
