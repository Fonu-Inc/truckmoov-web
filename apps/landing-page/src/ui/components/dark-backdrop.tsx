import { cn } from "@/lib/utils";

type Glow = {
  /** Tailwind position/size classes for one yellow radial glow. */
  className: string;
};

type DarkBackdropProps = {
  /** Show the faint white grid lines (Figma "Grid layers - v2"). */
  grid?: boolean;
  glows?: Glow[];
  /** `gradient` (default) = black/grey ink gradient, `solid` = flat black (home dark panel). */
  fill?: "gradient" | "solid";
  className?: string;
};

/**
 * Black gradient background with grid lines and yellow glows.
 * Shared by the home hero, page heroes, the CTA band and dark panels.
 * Render it as the first child of a `relative overflow-hidden` element.
 */
export default function DarkBackdrop({
  grid = true,
  glows = [],
  fill = "gradient",
  className,
}: DarkBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        fill === "gradient" ? "bg-ink-gradient" : "bg-ink",
        className,
      )}
    >
      {grid && (
        <div className="absolute inset-0 bg-[url('/grid-bg.png')] bg-cover bg-top opacity-35" />
      )}
      {glows.map(glow => (
        <div
          key={glow.className}
          className={cn(
            "absolute bg-brand-glow opacity-20",
            glow.className,
          )}
        />
      ))}
    </div>
  );
}
