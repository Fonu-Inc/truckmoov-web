"use client";

import type { ReactNode } from "react";
import {
  ArrowsClockwise,
  CloudArrowUp,
  Paperclip,
  Trash,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";
import { Pill } from "@/features/get-started/components/StepParts";
import { cn } from "@/shared/utils";

const CARD_CLASS = "rounded-[30px] bg-background shadow-[0_0_4px_rgb(0_0_0/0.25)]";

export type UploadStatus = "uploaded" | "pending" | "rejected";

const STATUS: Record<UploadStatus, {
  label: string;
  tone: "success" | "warning" | "danger";
}> = {
  uploaded: {
    label: "Uploaded",
    tone: "success",
  },
  pending: {
    label: "Not Uploaded",
    tone: "warning",
  },
  rejected: {
    label: "Rejected",
    tone: "danger",
  },
};

// One required document: empty → "Upload Document" pill; filed → file row with replace /
// remove actions and an optional error line (Figma "Frame 1160465353"). A "pending" file
// was picked but never reached the server; Retry sends it again.
export function UploadField({
  title,
  description,
  fileName,
  status,
  error,
  busy,
  pdfOnly,
  children,
  onSelect,
  onRemove,
  onRetry,
}: {
  title: string;
  description?: string;
  fileName?: string | null;
  status?: UploadStatus | null;
  error?: string | null;
  busy: boolean;
  pdfOnly?: boolean;
  /** Extra input under the title, e.g. the identification card type select. */
  children?: ReactNode;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  onRetry?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(fileName);

  return (
    <article
      onDragOver={event => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && !busy)
          onSelect(file);
      }}
      className={cn(
        CARD_CLASS,
        hasFile
          ? "px-[26px] py-[21px] max-sm:px-5"
          : "border border-border-field px-[31px] pt-[25px] pb-[21px] max-sm:px-5",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn(
          "min-w-0",
          hasFile && "pt-1",
        )}
        >
          <h3 className="text-sm leading-[18px] font-semibold text-heading">{title}</h3>
          {description && (!hasFile || status === "rejected") && (
            <p className="mt-3 text-xs leading-[17px] text-heading">{description}</p>
          )}
        </div>
        {status && <Pill tone={STATUS[status].tone}>{STATUS[status].label}</Pill>}
      </div>
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={pdfOnly ? "application/pdf,.pdf" : "application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png"}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file)
            onSelect(file);
          event.target.value = "";
        }}
      />
      {hasFile
        ? (
            <div className="mt-2.5 flex h-[45.5px] items-center gap-2.5 rounded-[12px] border-[0.5px] border-border bg-background pr-4 pl-[21px]">
              <Paperclip className="size-4 shrink-0" />
              <span className="flex-1 truncate text-xs font-medium text-heading">{fileName}</span>
              {status === "pending" && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={busy}
                  className="cursor-pointer rounded-full bg-primary px-3 py-1 text-2xs font-semibold text-heading disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Uploading…" : "Retry"}
                </button>
              )}
              <button
                type="button"
                aria-label="Replace document"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="cursor-pointer p-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowsClockwise className={cn(
                  "size-4",
                  busy && "animate-spin",
                )}
                />
              </button>
              {onRemove && (
                <button
                  type="button"
                  aria-label="Remove document"
                  onClick={onRemove}
                  disabled={busy}
                  className="cursor-pointer p-1.5 text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash className="size-4" />
                </button>
              )}
            </div>
          )
        : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="mt-[22px] flex h-[37.5px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[12px] border-[0.5px] border-border text-xs font-medium text-heading transition-colors hover:border-border-deep hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloudArrowUp className={cn(
                "size-4",
                busy && "animate-pulse",
              )}
              />
              {busy ? "Uploading…" : "Upload Document"}
            </button>
          )}
      {error && (
        <p className="mt-[13px] flex items-center gap-2 pl-[3px] text-2xs text-destructive/80">
          <Warning className="size-[13px] shrink-0" />
          {error}
        </p>
      )}
    </article>
  );
}
