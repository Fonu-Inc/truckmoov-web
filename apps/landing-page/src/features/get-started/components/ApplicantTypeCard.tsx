"use client";

import Image from "next/image";
import { cn } from "@/shared/utils";

type ApplicantTypeCardProps = {
  title: string;
  description: string;
  /** Public path of the illustration (e.g. "/images/get-started/map.png"). */
  illustration: string;
  /** Rendered size in CSS px; also sizes the responsive srcset. */
  illustrationWidth: number;
  illustrationHeight: number;
  illustrationClassName?: string;
  selected: boolean;
  onSelect: () => void;
};

// "What best describes you?" choice card with its illustration peeking out of
// the bottom-right corner (Figma "Frame 1160464627" / "Frame 1160464630").
export function ApplicantTypeCard({
  title,
  description,
  illustration,
  illustrationWidth,
  illustrationHeight,
  illustrationClassName,
  selected,
  onSelect,
}: ApplicantTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        // min-h: the longer titles and subtitles wrap; pr keeps them clear of the illustration.
        "relative min-h-[107px] cursor-pointer overflow-hidden rounded-[20px] bg-background px-5 pt-[22px] pb-[18px] text-left transition-colors",
        selected
          ? "border-2 border-brand-bright"
          : "border-[0.5px] border-border hover:border-border-deep",
      )}
    >
      <span className={cn(
        "relative block pr-16 text-lg leading-[22px] text-heading",
        selected ? "font-semibold" : "font-medium",
      )}
      >
        {title}
      </span>
      <span className="relative mt-1.5 block pr-20 text-xs leading-[17px] whitespace-pre-line text-muted-foreground">
        {description}
      </span>
      <Image
        src={illustration}
        alt=""
        width={illustrationWidth}
        height={illustrationHeight}
        className={cn(
          "pointer-events-none absolute object-contain",
          illustrationClassName,
        )}
      />
    </button>
  );
}
