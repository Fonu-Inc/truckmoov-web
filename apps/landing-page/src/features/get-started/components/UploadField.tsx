"use client";

import type { Upload } from "@/features/get-started/utils/getStartedContent";
import {
  ArrowsClockwise,
  CloudArrowUp,
  Paperclip,
  Trash,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";
import { cn } from "@/shared/utils";

const CARD_CLASS = "rounded-[30px] bg-background shadow-[0_0_4px_rgb(0_0_0/0.25)]";

function StatusBadge({ upload }: { upload: Upload }) {
  if (!upload.file)
    return null;

  return (
    <span className={cn(
      "flex h-5 shrink-0 items-center rounded-full px-3 text-2xs",
      upload.error
        ? "bg-warning-soft font-medium text-warning"
        : "bg-success-soft px-4 font-semibold text-success-deep",
    )}
    >
      {upload.error ? "Needs Attention" : "Uploaded"}
    </span>
  );
}

// One required document: empty → "Upload Document" pill; chosen → file row
// with replace / remove actions and an optional error line (Figma "Frame 1160465353").
export function UploadField({
  title,
  description,
  upload,
  isBusy,
  onSelect,
  onRemove,
}: {
  title: string;
  description: string;
  upload: Upload;
  isBusy: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(upload.file);

  return (
    <article className={cn(
      CARD_CLASS,
      hasFile
        ? "px-[26px] pt-[21px] pb-[21px]"
        : "border border-border-field px-[31px] pt-[25px] pb-[21px]",
    )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn(
          "min-w-0",
          hasFile && "pt-1",
        )}
        >
          <h3 className="text-sm leading-[18px] font-semibold text-heading">{title}</h3>
          {!hasFile && <p className="mt-3 text-xs leading-[17px] text-heading">{description}</p>}
        </div>
        <StatusBadge upload={upload} />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file)
            onSelect(file);
          event.target.value = "";
        }}
      />
      {upload.file
        ? (
            <div className="mt-2.5 flex h-[45.5px] items-center gap-2.5 rounded-[12px] border-[0.5px] border-border bg-background pr-4 pl-[21px]">
              <Paperclip className="size-4 shrink-0" />
              <span className="flex-1 truncate text-xs font-medium text-heading">{upload.file.name}</span>
              <button
                type="button"
                aria-label="Replace document"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
                className="cursor-pointer p-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowsClockwise className={cn(
                  "size-4",
                  isBusy && "animate-spin",
                )}
                />
              </button>
              <button
                type="button"
                aria-label="Remove document"
                onClick={onRemove}
                disabled={isBusy}
                className="cursor-pointer p-1.5 text-destructive disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash className="size-4" />
              </button>
            </div>
          )
        : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="mt-[22px] flex h-[37.5px] w-full max-w-[482.5px] cursor-pointer items-center justify-center gap-2.5 rounded-[12px] border-[0.5px] border-border text-xs font-medium text-heading transition-colors hover:border-border-deep hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloudArrowUp className={cn(
                "size-4",
                isBusy && "animate-pulse",
              )}
              />
              {isBusy ? "Uploading…" : "Upload Document"}
            </button>
          )}
      {upload.error && (
        <p className="mt-[13px] flex items-center gap-2 pl-[3px] text-2xs text-destructive/80">
          <Warning className="size-[13px] shrink-0" />
          {upload.error}
        </p>
      )}
    </article>
  );
}
