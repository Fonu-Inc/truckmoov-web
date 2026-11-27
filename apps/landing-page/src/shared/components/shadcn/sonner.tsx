"use client";

import { Toaster as Sonner } from "sonner";

/** Light-only copy of the main app's toaster: this site has no theme switch. */
function Toaster() {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      expand={false}
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:rounded-lg",
          success: "group-[.toaster]:border-success/30 group-[.toaster]:bg-success-soft group-[.toaster]:text-success-deep",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/10",
        },
      }}
    />
  );
}

export { Toaster };
