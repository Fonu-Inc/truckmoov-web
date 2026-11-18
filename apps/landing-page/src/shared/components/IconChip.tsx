import type { IconType } from "@/shared/utils/routes";
import { cn } from "@/shared/utils";

const SIZES = {
  /** 32px, nav mega menu */
  sm: "size-8 rounded-[10px] [&_svg]:size-3.5",
  /** 45px, feature / integration / role cards */
  md: "size-[45px] rounded-[12px] [&_svg]:size-6",
  /** 50px, customer cards */
  lg: "size-[50px] rounded-[12px] [&_svg]:size-6",
  /** 60px, page hero */
  xl: "size-15 rounded-[20px] [&_svg]:size-[30px]",
  /** 80px circle overlapping media-card images */
  media: "size-20 rounded-full [&_svg]:size-8",
} as const;

const TONES = {
  /** 15% yellow, brand icon (home cards) */
  soft: "bg-brand-soft text-brand",
  /** 20% yellow, brand icon (nav menu) */
  tint: "bg-brand-tint text-brand",
  /** 20% yellow, deep-yellow icon (stakeholder pages) */
  tintDeep: "bg-brand-tint text-brand-deep",
  /** solid yellow, black icon */
  solid: "bg-brand-bright text-ink",
  /** white circle used on media cards */
  white: "rounded-full bg-background text-brand",
} as const;

type IconChipProps = {
  icon: IconType;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  className?: string;
};

/** Square tinted tile holding an icon — the recurring "Frame 17" in Figma. */
export function IconChip({
  icon: Icon,
  size = "md",
  tone = "soft",
  className,
}: IconChipProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      <Icon />
    </span>
  );
}
