import type {
  FieldKey,
  Fields,
  Upload,
  Uploads,
  VerifyStatus,
} from "./get-started-data";
import {
  AlertTriangle,
  Check,
  CloudUpload,
  Info,
  Paperclip,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { useRef } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/ui/shadcn/button";
import {
  DOCUMENTS,
  ORG_FIELDS,
  ORG_TYPES,
} from "./get-started-data";

function Heading({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <header className="space-y-2">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-base text-[#4D4D4D]">{description}</p>
    </header>
  );
}

function InfoRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn(
      "flex items-center gap-3 text-base text-foreground",
      className,
    )}
    >
      <Info className="size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-13 w-full rounded-2xl border border-border-100 px-5 text-base outline-none transition-colors placeholder:text-[#9A9A9A] focus:border-primary"
      />
    </label>
  );
}

export function OrganizationStep({
  orgType,
  onOrgTypeChange,
  fields,
  onFieldChange,
}: {
  orgType: string | null;
  onOrgTypeChange: (id: string) => void;
  fields: Fields;
  onFieldChange: (key: FieldKey, value: string) => void;
}) {
  return (
    <div className="space-y-8">
      <Heading
        title="What best describes you?"
        description="This Helps Us Set Up The Right Application For You."
      />
      <div className="grid grid-cols-2 gap-5">
        {ORG_TYPES.map(type => (
          <button
            key={type.id}
            type="button"
            onClick={() => onOrgTypeChange(type.id)}
            className={cn(
              "relative flex h-[132px] cursor-pointer flex-col rounded-2xl border p-5 text-left transition-colors",
              orgType === type.id ? "border-2 border-primary" : "border-border-100 hover:border-border",
            )}
          >
            <span className="text-xl font-bold">{type.title}</span>
            <span className="mt-1 w-[70%] text-[13px] text-[#4D4D4D]">{type.description}</span>
            <img
              src={type.illustration}
              alt=""
              className="absolute right-3 bottom-3 h-15 w-24 object-contain"
            />
          </button>
        ))}
      </div>
      <div className="space-y-6">
        <h3 className="text-xl font-bold">Organization Details</h3>
        {ORG_FIELDS.map(field => (
          <Field
            key={field.key}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            value={fields[field.key]}
            onChange={value => onFieldChange(
              field.key,
              value,
            )}
          />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ upload }: { upload: Upload }) {
  if (!upload.file)
    return null;

  return (
    <span className={cn(
      "rounded-full px-3 py-1.5 text-xs font-bold",
      upload.error ? "bg-[#FDF0CE] text-[#B58A00]" : "bg-[#E6F9E8] text-[#16A34A]",
    )}
    >
      {upload.error ? "Needs Attention" : "Uploaded"}
    </span>
  );
}

function DocCard({
  title,
  description,
  upload,
  onSelect,
  onRemove,
}: {
  title: string;
  description: string;
  upload: Upload;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <article className="space-y-5 rounded-2xl border border-border-100 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-base font-bold">{title}</h3>
          {!upload.file && <p className="text-sm text-[#4D4D4D]">{description}</p>}
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
            <div className="flex items-center gap-3 rounded-xl border border-border-100 px-4 py-3">
              <Paperclip className="size-4 shrink-0" />
              <span className="flex-1 truncate text-base">{upload.file.name}</span>
              <button
                type="button"
                aria-label="Replace document"
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer p-1"
              >
                <RefreshCw className="size-4.5" />
              </button>
              <button
                type="button"
                aria-label="Remove document"
                onClick={onRemove}
                className="cursor-pointer p-1 text-[#E5484D]"
              >
                <Trash2 className="size-4.5" />
              </button>
            </div>
          )
        : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-13 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border-100 text-base transition-colors hover:border-border"
            >
              <CloudUpload className="size-5" />
              Upload Document
            </button>
          )}
      {upload.error && (
        <p className="flex items-center gap-2 text-sm text-[#E5484D]">
          <AlertTriangle className="size-4 shrink-0" />
          {upload.error}
        </p>
      )}
    </article>
  );
}

export function UploadStep({
  uploads,
  onSelect,
  onRemove,
}: {
  uploads: Uploads;
  onSelect: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Heading
        title="Upload your supporting documents"
        description="Please Provide The Documents Required To Process Your Application."
      />
      <InfoRow>Accepted Formats: PDF, JPG, PNG (Max 10MB Each).</InfoRow>
      <div className="space-y-5">
        {DOCUMENTS.map(document => (
          <DocCard
            key={document.id}
            title={document.title}
            description={document.description}
            upload={uploads[document.id]}
            onSelect={file => onSelect(
              document.id,
              file,
            )}
            onRemove={() => onRemove(document.id)}
          />
        ))}
      </div>
    </div>
  );
}

function GreenCheck({ className }: { className?: string }) {
  return (
    <span className={cn(
      "flex size-6 shrink-0 items-center justify-center rounded-full bg-[#16A34A]",
      className,
    )}
    >
      <Check
        className="size-3.5 text-white"
        strokeWidth={3.5}
      />
    </span>
  );
}

export function DocumentCheckStep({ uploads }: { uploads: Uploads }) {
  return (
    <div className="space-y-6">
      <Heading
        title="Check your documents"
        description="We've Done A Quick Format Check. Final Verification Happens During Application Review."
      />
      <p className="flex items-center gap-3 rounded-2xl bg-[#E9FBE9] px-6 py-5 text-lg font-medium text-[#16A34A]">
        <Check className="size-5 shrink-0" />
        All Documents Passed The Format Check.
      </p>
      <div className="space-y-5">
        {DOCUMENTS.map(document => (
          <article
            key={document.id}
            className="flex gap-4 rounded-2xl border border-border-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
          >
            <GreenCheck className="mt-0.5" />
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-bold">{document.title}</h3>
              <p className="text-sm text-[#4D4D4D]">
                Uploaded ·
                {" "}
                {uploads[document.id].file?.name}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function StatusScreen({
  status,
  verifyingTitle,
  verifyingDescription,
  verifiedTitle,
  verifiedDescription,
}: {
  status: Exclude<VerifyStatus, "idle">;
  verifyingTitle: string;
  verifyingDescription: string;
  verifiedTitle: string;
  verifiedDescription: string;
}) {
  return (
    <div className="flex flex-col items-center pt-24 text-center">
      {status === "verifying"
        ? <span className="size-14 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
        : (
            <span className="flex size-28 items-center justify-center rounded-full bg-[#F1FBE9]">
              <span className="flex size-24 items-center justify-center rounded-full bg-[#A9DE7C]">
                <Check
                  className="size-11 text-[#1E6A1E]"
                  strokeWidth={3}
                />
              </span>
            </span>
          )}
      <h2 className="mt-10 text-2xl font-bold">
        {status === "verifying" ? verifyingTitle : verifiedTitle}
      </h2>
      <p className="mt-2 text-base text-[#4D4D4D]">
        {status === "verifying" ? verifyingDescription : verifiedDescription}
      </p>
    </div>
  );
}

function OtpBoxes({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  return (
    <div className="flex gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key -- fixed-length OTP boxes
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ""}
          onChange={(event) => {
            const digit = event.target.value.replace(
              /\D/g,
              "",
            ).slice(-1);
            const next = value.padEnd(
              6,
              " ",
            ).split("");
            next[index] = digit || " ";
            onChange(next.join("").trimEnd());
            if (digit)
              inputsRef.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[index])
              inputsRef.current[index - 1]?.focus();
          }}
          className="h-20 w-17 rounded-2xl border border-border-100 bg-[#F7F7F7] text-center text-lg font-bold outline-none transition-colors focus:border-primary"
        />
      ))}
    </div>
  );
}

export function VerifyStep({
  description,
  code,
  onCodeChange,
  onVerify,
  resendLabel,
  resendPrompt,
  changeLabel,
  changePrompt,
  actionLabel,
}: {
  description: React.ReactNode;
  code: string;
  onCodeChange: (value: string) => void;
  onVerify: () => void;
  resendPrompt: string;
  resendLabel: string;
  changePrompt: string;
  changeLabel: string;
  actionLabel: string;
}) {
  return (
    <div className="space-y-8">
      <Heading
        title={actionLabel === "Verify Email" ? "Verify your email" : "Verify your phone number"}
        description={description}
      />
      <OtpBoxes
        value={code}
        onChange={onCodeChange}
      />
      <div className="space-y-3">
        <InfoRow>
          {resendPrompt}
          {" "}
          <button
            type="button"
            className="cursor-pointer font-bold text-primary-100"
          >
            {resendLabel}
          </button>
        </InfoRow>
        <InfoRow>
          {changePrompt}
          {" "}
          <button
            type="button"
            className="cursor-pointer font-bold text-primary-100"
          >
            {changeLabel}
          </button>
        </InfoRow>
      </div>
      <Button
        onClick={onVerify}
        disabled={code.length < 6}
        className="h-14 w-full rounded-2xl text-base font-bold"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 rounded-full border border-border-100 px-6 py-3 text-base font-medium"
    >
      <Pencil className="size-4 text-primary-100" />
      Edit
    </button>
  );
}

export function ReviewStep({
  fields,
  uploads,
  onEdit,
}: {
  fields: Fields;
  uploads: Uploads;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-100 p-7 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Organization Details</h2>
          <EditButton onClick={() => onEdit(0)} />
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-7">
          {ORG_FIELDS.map(field => (
            <div key={field.key}>
              <dt className="text-sm text-[#6B6B6B] uppercase">{field.reviewLabel}</dt>
              <dd className="mt-1 text-base">{fields[field.key]}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-2xl bg-[#FAFAFA] p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Documents Submitted</h2>
          <EditButton onClick={() => onEdit(1)} />
        </div>
        <ul className="mt-7 space-y-4">
          {DOCUMENTS.map(document => (
            <li
              key={document.id}
              className="flex items-center gap-4"
            >
              <GreenCheck />
              <span className="text-base">{document.title}</span>
              <span className="sr-only">{uploads[document.id].file?.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const TIMELINE = [
  "Application submitted",
  "Organization details received",
  "Documents received",
];

export function SubmittedStep({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center pt-8 text-center">
      <span className="flex size-28 items-center justify-center rounded-full bg-[#F1FBE9]">
        <span className="flex size-24 items-center justify-center rounded-full bg-[#A9DE7C]">
          <Check
            className="size-11 text-[#1E6A1E]"
            strokeWidth={3}
          />
        </span>
      </span>
      <h2 className="mt-8 max-w-[420px] text-3xl font-bold">Application Submitted Successfully</h2>
      <p className="mt-3 max-w-[520px] text-base text-[#4D4D4D]">
        Your Fleet Pro Application Has Been Received And Is Being Processed. When Your
        Application Is Approved A Setup Link Would Be Sent To
        {" "}
        <span className="font-bold text-foreground">{email}</span>
        .
      </p>
      <ul className="mt-9 w-full space-y-0 rounded-2xl bg-[#FAFAFA] px-7 py-7 text-left">
        {TIMELINE.map((item, index) => (
          <li
            key={item}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Check
                  className="size-3.5 text-white"
                  strokeWidth={3.5}
                />
              </span>
              <span className={cn(
                "flex-1",
                index === TIMELINE.length - 1
                  ? "border-l-2 border-dashed border-border"
                  : "w-0.5 bg-primary-100",
              )}
              />
            </div>
            <span className="pb-6 text-base">{item}</span>
          </li>
        ))}
        <li className="flex gap-4">
          <span className="size-6 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-base">
            Application Review
            <span className="mt-1 block text-sm text-primary-100">In-Progress</span>
          </span>
        </li>
      </ul>
      <InfoRow className="mt-7 max-w-[520px] items-start text-sm text-[#4D4D4D]">
        This Process May Take 30 Minutes To 1 Hour. Please Be Patient While We Complete Your
        Request.
      </InfoRow>
    </div>
  );
}
