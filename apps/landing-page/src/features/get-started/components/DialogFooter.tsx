"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Save,
} from "lucide-react";
import { use } from "react";
import { ApplicationSaveContext } from "@/features/get-started/components/ApplicationSaveContext";
import {
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

// Wizard footer: ghost "← Back" and the yellow "Continue →" button
// (Figma "Frame 1160464628"). `backMuted` greys Back on the first step. With `form` the
// Continue button submits that react-hook-form form instead of calling `onContinue`.
export function DialogFooter({
  onBack,
  onContinue,
  continueLabel,
  continueDisabled = false,
  continueLoading = false,
  backMuted = false,
  backLabel = "Back",
  continueArrow = true,
  form,
  extra,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  backMuted?: boolean;
  backLabel?: string;
  /** False drops the → from the Continue button (steps whose design shows a plain label). */
  continueArrow?: boolean;
  form?: string;
  /** Shown between the two buttons, e.g. "Save & Continue Later". */
  extra?: ReactNode;
}) {
  const onSave = use(ApplicationSaveContext);
  return (
    <footer className="mx-[14px] flex min-h-[98px] shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-[10px] py-3">
      {onBack
        ? (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "flex h-[45px] w-[110px] cursor-pointer items-center justify-center gap-[11px] rounded-[12px] text-sm font-medium transition-colors hover:bg-surface sm:w-[140px]",
                backMuted ? "text-heading/50" : "text-heading",
              )}
            >
              <ArrowLeft
                className="size-3.5"
                strokeWidth={1.5}
              />
              {backLabel}
            </button>
          )
        : <span />}
      {extra}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          className={cn(
            SECONDARY_BUTTON_CLASS,
            "order-last h-[45px] w-full sm:order-none sm:w-auto",
          )}
        >
          <Save className="size-3.5 shrink-0" />
          Save and continue later
        </button>
      )}
      {continueLabel && (
        <button
          type={form ? "submit" : "button"}
          form={form}
          onClick={form ? undefined : onContinue}
          disabled={continueDisabled || continueLoading}
          className={cn(
            PRIMARY_BUTTON_CLASS,
            "min-w-[165px] gap-[14px]",
          )}
        >
          {continueLoading ? "Please wait…" : continueLabel}
          {continueArrow && (
            <ArrowRight
              className="size-3.5"
              strokeWidth={1.5}
            />
          )}
        </button>
      )}
    </footer>
  );
}
