"use client";

import {
  Rocket,
  X,
} from "lucide-react";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

// Wizard header: yellow rocket tile, title + subtitle, close X (Figma "Frame 1160464637").
// A returning (existing MTN) customer gets the main app's returning copy.
export function DialogHeader({ returning = false }: { returning?: boolean }) {
  return (
    <header className="relative flex shrink-0 items-center gap-[15px] border-b border-border-field px-7 py-7 pr-20 max-sm:px-4 max-sm:py-5">
      <span className="flex size-[60px] shrink-0 items-center justify-center rounded-[15px] bg-brand-tint max-sm:size-12">
        <Rocket
          className="size-6 text-brand-deep"
          strokeWidth={2}
        />
      </span>
      <div className="min-w-0 space-y-[7px]">
        <DialogTitle className="text-[20px] leading-[25px] font-medium text-heading max-sm:text-lg">
          {returning ? "Returning MTN customer onboarding" : "Application for Account Creation"}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {returning
            ? "You already have an existing relationship or account with MTN, Complete your FleetPro Onboarding."
            : "Complete The Steps Below To Apply For A Fleet Pro Account."}
        </DialogDescription>
      </div>
      <DialogClose className="absolute top-1/2 right-9 -translate-y-1/2 cursor-pointer rounded-sm text-foreground transition-opacity hover:opacity-70 max-sm:right-4">
        <X
          className="size-6"
          strokeWidth={2}
        />
        <span className="sr-only">Close</span>
      </DialogClose>
    </header>
  );
}
