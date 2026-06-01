import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  className?: string;
  asChild?: boolean;
}

export function TooltipWrapper({
  content,
  children,
  side = "top",
  delayDuration = 300,
  className,
  asChild = true,
}: TooltipWrapperProps) {
  // If children can't accept refs (e.g., non-forwardRef components), wrap in span
  const trigger = asChild ? (
    <TooltipTrigger asChild>
      <span className="inline-flex">{children}</span>
    </TooltipTrigger>
  ) : (
    <TooltipTrigger asChild>
      <span className="inline-flex">{children}</span>
    </TooltipTrigger>
  );

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        {trigger}
        <TooltipContent side={side} className={className}>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
