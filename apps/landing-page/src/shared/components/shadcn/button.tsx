import type { ButtonVariantProps } from "@/shared/components/shadcn/button-variants";
import { Slot } from "radix-ui";
import * as React from "react";

import { buttonVariants } from "@/shared/components/shadcn/button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button">
  & ButtonVariantProps & { asChild?: boolean }) {
  const Comp = (asChild ? Slot.Root : "button") as React.ElementType;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      // buttonVariants already merges className with tailwind-merge.
      className={buttonVariants({
        variant,
        size,
        className,
      })}
      {...props}
    />
  );
}

export { Button };
