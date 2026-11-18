import type { VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { buttonVariants } from "@/shared/components/shadcn/button-variants";
import { cn } from "@/shared/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button">
  & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = (asChild ? Slot.Root : "button") as React.ElementType;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({
        variant,
        size,
        className,
      }))}
      {...props}
    />
  );
}

export { Button };
