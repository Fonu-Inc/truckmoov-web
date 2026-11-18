"use client";

import type { MouseEvent } from "react";
import { Download } from "lucide-react";
import { cn } from "@/shared/utils";

const VARIANTS = {
  /** Yellow 111x40 pill on each document row. */
  solid: "h-10 w-[111px] border-brand/20 bg-primary hover:bg-brand",
  /** White 128x46 outline pill in the card header ("Download All"). */
  outline: "h-[46px] w-32 border-subtle-foreground/20 bg-background hover:bg-surface",
} as const;

type DownloadButtonProps = {
  label: string;
  /** File URL; when missing the button keeps its look but does nothing. */
  href?: string;
  variant?: keyof typeof VARIANTS;
  /** Accessible name (e.g. "Download Platform overview"). */
  ariaLabel?: string;
  className?: string;
};

// TODO(content): documents aren't published yet — every href is omitted in resources-data.ts.
function preventEmptyDownload(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

/** Pill-shaped download link (Figma "Button" with the Download icon). */
export function DownloadButton({
  label,
  href,
  variant = "solid",
  ariaLabel,
  className,
}: DownloadButtonProps) {
  return (
    <a
      href={href ?? "#"}
      download={href ? true : undefined}
      onClick={href ? undefined : preventEmptyDownload}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border text-xs leading-[15px] font-medium text-heading transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        VARIANTS[variant],
        className,
      )}
    >
      <Download
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-4 text-foreground"
      />
      {label}
    </a>
  );
}
