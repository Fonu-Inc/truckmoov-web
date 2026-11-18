import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardGridProps = PropsWithChildren<{ className?: string }>;

/**
 * Three-column card grid (Figma: rows of 375px cards, 30px column / 40px row gap).
 * Stacks to 1 column on phones and 2 on tablets. Override gaps through `className`.
 */
export default function CardGrid({
  children,
  className,
}: CardGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-[30px] lg:gap-y-10 xl:grid-cols-[repeat(3,375px)]",
      className,
    )}
    >
      {children}
    </div>
  );
}
