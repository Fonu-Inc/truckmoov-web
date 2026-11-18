import type {
  OrganizationFormValues,
  Uploads,
} from "./get-started-data";
import { PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DOCUMENTS,
  REVIEW_ROWS,
} from "./get-started-data";
import { PassedIcon } from "./step-parts";

const SECTION_CLASS = "rounded-[30px] shadow-[0_0_4px_rgb(0_0_0/0.25)]";

function EditButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-[37.5px] w-[81.5px] shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full border-[0.5px] border-border bg-background text-xs font-semibold text-heading transition-colors hover:bg-surface"
    >
      <PencilSimple className="size-3 text-brand-deep" />
      Edit
    </button>
  );
}

function SectionHeader({
  title,
  onEdit,
  editLabel,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[20px] leading-[25px] font-semibold text-heading">{title}</h2>
      <EditButton
        onClick={onEdit}
        label={editLabel}
      />
    </div>
  );
}

export function ReviewStep({
  values,
  uploads,
  onEdit,
}: {
  values: OrganizationFormValues;
  uploads: Uploads;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="space-y-5 pt-[27px]">
      <section className={cn(
        SECTION_CLASS,
        "bg-background pt-[15px] pr-6 pb-[30px] pl-[25px]",
      )}
      >
        <SectionHeader
          title="Organization Details"
          onEdit={() => onEdit(0)}
          editLabel="Edit organization details"
        />
        <dl className="mt-[15px] grid gap-x-5 gap-y-[29px] pl-2.5 sm:grid-cols-2">
          {REVIEW_ROWS.map(row => (
            <div
              key={row.label}
              className="min-w-0"
            >
              <dt className="text-xs leading-[15px] font-medium text-muted-foreground uppercase">{row.label}</dt>
              <dd className="mt-[5px] text-sm leading-[18px] font-medium break-words text-heading">{row.value(values)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={cn(
        SECTION_CLASS,
        "rounded-[20px] bg-surface pt-[15px] pr-[22px] pb-[30px] pl-5",
      )}
      >
        <SectionHeader
          title="Documents Submitted"
          onEdit={() => onEdit(1)}
          editLabel="Edit documents"
        />
        <ul className="mt-5 space-y-[14px] pl-[6px]">
          {DOCUMENTS.map(document => (
            <li
              key={document.id}
              className="flex items-center gap-[13px]"
            >
              <PassedIcon />
              <span className="text-sm leading-5 text-heading">{document.title}</span>
              <span className="sr-only">{uploads[document.id].file?.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
