import type { PropsWithChildren } from "react";
import { cn } from "@/shared/utils";

type ContentSheetProps = PropsWithChildren<{ className?: string }>;

/** White body with 50px rounded top corners that slides over the bottom of a dark hero. */
export function ContentSheet({
  children,
  className,
}: ContentSheetProps) {
  return (
    <div className={cn(
      "relative z-10 -mt-[60px] rounded-t-[50px] bg-background",
      className,
    )}
    >
      {children}
    </div>
  );
}
