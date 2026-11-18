"use client";

import type { ComponentProps } from "react";
import type { DialogId } from "@/shared/stores/dialogStore";
import { dialogStore } from "@/shared/stores/dialogStore";

type DialogTriggerProps = Omit<ComponentProps<"button">, "type"> & {
  /** Which site dialog this button opens. */
  dialog: DialogId;
};

/**
 * A button that opens a site dialog. It holds no state and subscribes to nothing, so it never
 * re-renders; the dialog itself lives once in the DialogHost. Style it like a Button with
 * `className={buttonVariants({ variant, size })}` (from shadcn/button-variants).
 *
 * It renders its own <button> rather than cloning a server-rendered child: cloning (Radix Slot)
 * across the server/client boundary hydrates differently from the server HTML.
 */
export function DialogTrigger({
  dialog,
  onClick,
  ...props
}: DialogTriggerProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => {
        onClick?.(event);
        dialogStore.open(dialog);
      }}
      {...props}
    />
  );
}
