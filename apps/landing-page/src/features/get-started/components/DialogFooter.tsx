"use client";

import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/shared/utils";

// Wizard footer: ghost "← Back" and the yellow "Continue →" button
// (Figma "Frame 1160464628"). `backMuted` greys Back on the first step.
export function DialogFooter({
  onBack,
  onContinue,
  continueLabel,
  continueDisabled,
  backMuted,
}: {
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  continueDisabled: boolean;
  backMuted: boolean;
}) {
  return (
    <footer className="mx-[14px] flex h-[98px] shrink-0 items-center justify-between border-t border-border px-[10px]">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "flex h-[45px] w-[120px] cursor-pointer items-center justify-center gap-[11px] rounded-[12px] text-sm font-medium transition-colors hover:bg-surface sm:w-[165px]",
          backMuted ? "text-heading/50" : "text-heading",
        )}
      >
        <ArrowLeft
          className="size-3.5"
          strokeWidth={1.5}
        />
        Back
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
        className="flex h-[45px] min-w-[165px] cursor-pointer items-center justify-center gap-[14px] rounded-[12px] border-[0.2px] border-brand-deep/20 bg-primary px-6 text-sm font-medium text-heading shadow-button transition-[background-color,opacity] hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary"
      >
        {continueLabel}
        <ArrowRight
          className="size-3.5"
          strokeWidth={1.5}
        />
      </button>
    </footer>
  );
}
