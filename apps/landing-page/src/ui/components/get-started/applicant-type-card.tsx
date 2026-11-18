import { cn } from "@/lib/utils";

// "What best describes you?" choice card with its illustration peeking out of
// the bottom-right corner (Figma "Frame 1160464627" / "Frame 1160464630").
export function ApplicantTypeCard({
  title,
  description,
  illustration,
  illustrationClassName,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  illustration: string;
  illustrationClassName?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative h-[107px] cursor-pointer overflow-hidden rounded-[20px] bg-background px-5 pt-[22px] text-left transition-colors",
        selected
          ? "border-2 border-brand-bright"
          : "border-[0.5px] border-border hover:border-border-deep",
      )}
    >
      <span className={cn(
        "block text-lg leading-[22px] text-heading",
        selected ? "font-semibold" : "font-medium",
      )}
      >
        {title}
      </span>
      <span className="mt-1.5 block text-xs leading-[17px] whitespace-pre-line text-muted-foreground">
        {description}
      </span>
      <img
        src={illustration}
        alt=""
        className={cn(
          "pointer-events-none absolute object-contain",
          illustrationClassName,
        )}
      />
    </button>
  );
}
