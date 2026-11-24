"use client";

import { SubDialog } from "@/features/get-started/components/SubDialog";
import { SECONDARY_BUTTON_CLASS } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

export type DetailState = {
  title: string;
  fields: {
    key: string;
    label: string;
    value: string;
  }[];
};

/** Read-only view of one fleet row (main app: DetailDialog in view mode). Editing goes through VehicleModal. */
export function DetailDialog({
  detail,
  onClose,
}: {
  detail: DetailState | null;
  onClose: () => void;
}) {
  return (
    <SubDialog
      open={Boolean(detail)}
      onOpenChange={open => !open && onClose()}
      title={detail?.title ?? ""}
      description="Review the details you entered."
      footer={(
        <button
          type="button"
          className={cn(
            SECONDARY_BUTTON_CLASS,
            "h-[45px] px-6 text-sm",
          )}
          onClick={onClose}
        >
          Close
        </button>
      )}
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        {detail?.fields.map(field => (
          <div
            key={field.key}
            className="space-y-1.5"
          >
            <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
            <dd className="rounded-[12px] bg-surface px-3 py-2 text-sm text-heading">{field.value || "-"}</dd>
          </div>
        ))}
      </dl>
    </SubDialog>
  );
}
