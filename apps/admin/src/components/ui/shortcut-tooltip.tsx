import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ShortcutTooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  className?: string;
}

export function ShortcutTooltip({
  content,
  shortcut,
  children,
  side = "top",
  delayDuration = 300,
  className,
}: ShortcutTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side} className={cn("flex items-center gap-2", className)}>
          <span>{content}</span>
          {shortcut && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Keyboard shortcut badge component for inline display
export function ShortcutBadge({ shortcut, className }: { shortcut: string; className?: string }) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className
      )}
    >
      {shortcut}
    </kbd>
  );
}



