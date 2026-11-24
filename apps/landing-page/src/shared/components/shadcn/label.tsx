"use client";

import { Label as LabelPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/utils";

function Label({
  className,
  required,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
  /** Shows a red asterisk after the text. Set it on every field the form refuses to submit empty. */
  required?: boolean;
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {/* The label is flex gap-2; -ml-1.5 sits the asterisk 2px from the text. */}
      {required && (
        <span
          aria-hidden="true"
          className="-ml-1.5 text-destructive"
        >
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
}

export { Label };
