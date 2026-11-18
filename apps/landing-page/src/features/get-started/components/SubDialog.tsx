"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils";

/**
 * A dialog opened from inside the apply modal (add vehicle, request devices, confirm…),
 * in the same rounded-[30px] look: title row, scrolling body, button row.
 */
export function SubDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-[30px] border-border-field p-0 shadow-float sm:max-w-[560px]",
          className,
        )}
      >
        <header className="relative shrink-0 border-b border-border-field px-7 py-6 pr-16 max-sm:px-4">
          <DialogTitle className="text-lg leading-[22px] font-semibold text-heading">{title}</DialogTitle>
          <DialogDescription className={cn(
            "mt-1.5 text-xs leading-[17px] text-muted-foreground",
            !description && "sr-only",
          )}
          >
            {description ?? title}
          </DialogDescription>
          <DialogClose className="absolute top-6 right-7 cursor-pointer rounded-sm text-foreground transition-opacity hover:opacity-70 max-sm:right-4">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </header>
        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 max-sm:px-4">{children}</div>
        )}
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-7 py-4 max-sm:px-4">
            {footer}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
