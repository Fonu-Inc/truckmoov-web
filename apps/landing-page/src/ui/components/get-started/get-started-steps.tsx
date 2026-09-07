import type { OnboardingApplicationTimelineEntry } from "@truckmoov/api/auth";
import type { UseFormReturn } from "react-hook-form";
import type {
  OrganizationFormValues,
  Upload,
  Uploads,
  VerifyCodeValues,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/shadcn/form";
import { Input } from "@/ui/shadcn/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/ui/shadcn/input-otp";
import {
  DOCUMENTS,
  NIGERIAN_STATES,
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

export function OrganizationStep({ form }: { form: UseFormReturn<OrganizationFormValues> }) {
  const applicantType = form.watch("applicantType");
  const applicantError = form.formState.errors.applicantType?.message;

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
            onClick={() => form.setValue(
              "applicantType",
              type.id,
              {
                shouldValidate: true,
                shouldDirty: true,
              },
            )}
            aria-pressed={applicantType === type.id}
            className={cn(
              "relative flex h-[132px] cursor-pointer flex-col rounded-2xl border p-5 text-left transition-colors",
              applicantType === type.id ? "border-2 border-primary" : "border-border-100 hover:border-border",
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
      {applicantError && (
        <p className="text-sm text-destructive">{applicantError}</p>
      )}
      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <h3 className="text-xl font-bold">Organization Details</h3>
          {ORG_FIELDS.map(field => (
            <FormField
              key={field.key}
              control={form.control}
              name={field.key}
              render={({ field: rhfField }) => (
                <FormItem>
                  <FormLabel className="text-base font-normal">{field.label}</FormLabel>
                  <FormControl>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="rounded-2xl border-border-100 h-13 text-base placeholder:text-[#9A9A9A]"
                      {...rhfField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="state"
            render={({ field: rhfField }) => (
              <FormItem>
                <FormLabel className="text-base font-normal">State</FormLabel>
                <FormControl>
                  <select
                    {...rhfField}
                    value={rhfField.value ?? ""}
                    className="h-13 w-full rounded-2xl border border-border-100 bg-background px-4 text-base"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select a state
                    </option>
                    {NIGERIAN_STATES.map(state => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
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
                disabled={isBusy}
                className="cursor-pointer p-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={cn(
                  "size-4.5",
                  isBusy && "animate-spin",
                )}
                />
              </button>
              <button
                type="button"
                aria-label="Remove document"
                onClick={onRemove}
                disabled={isBusy}
                className="cursor-pointer p-1 text-[#E5484D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4.5" />
              </button>
            </div>
          )
        : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="flex h-13 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border-100 text-base transition-colors hover:border-border disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloudUpload className={cn(
                "size-5",
                isBusy && "animate-spin",
              )}
              />
              {isBusy ? "Uploading…" : "Upload Document"}
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
  busy,
  onSelect,
  onRemove,
}: {
  uploads: Uploads;
  busy: Partial<Record<string, boolean>>;
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
            isBusy={Boolean(busy[document.id])}
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
  const allPassed = DOCUMENTS.every(document => uploads[document.id].file && !uploads[document.id].error);

  return (
    <div className="space-y-6">
      <Heading
        title="Check your documents"
        description="We've Done A Quick Format Check. Final Verification Happens During Application Review."
      />
      {allPassed
        ? (
            <p className="flex items-center gap-3 rounded-2xl bg-[#E9FBE9] px-6 py-5 text-lg font-medium text-[#16A34A]">
              <Check className="size-5 shrink-0" />
              All Documents Passed The Format Check.
            </p>
          )
        : (
            <p className="flex items-center gap-3 rounded-2xl bg-[#FDF0CE] px-6 py-5 text-lg font-medium text-[#B58A00]">
              <AlertTriangle className="size-5 shrink-0" />
              Some Documents Need Attention.
            </p>
          )}
      <div className="space-y-5">
        {DOCUMENTS.map((document) => {
          const upload = uploads[document.id];
          const failed = !upload.file || upload.error;
          return (
            <article
              key={document.id}
              className="flex gap-4 rounded-2xl border border-border-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
            >
              {failed
                ? <AlertTriangle className="mt-0.5 size-6 text-[#B58A00]" />
                : <GreenCheck className="mt-0.5" />}
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-bold">{document.title}</h3>
                <p className="text-sm text-[#4D4D4D]">
                  {upload.file
                    ? `Uploaded · ${upload.file.name}`
                    : "Missing"}
                  {upload.error && ` · ${upload.error}`}
                </p>
              </div>
            </article>
          );
        })}
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

export function VerifyStep({
  form,
  description,
  onVerify,
  onResend,
  onChangeContact,
  cooldownSeconds,
  isSending,
  isVerifying,
  resendLabel,
  resendPrompt,
  changeLabel,
  changePrompt,
  actionLabel,
}: {
  form: UseFormReturn<VerifyCodeValues>;
  description: React.ReactNode;
  onVerify: (values: VerifyCodeValues) => void;
  onResend: () => void;
  onChangeContact: () => void;
  cooldownSeconds: number;
  isSending: boolean;
  isVerifying: boolean;
  resendPrompt: string;
  resendLabel: string;
  changePrompt: string;
  changeLabel: string;
  actionLabel: string;
}) {
  const resendDisabled = cooldownSeconds > 0 || isSending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onVerify)}
        className="space-y-8"
      >
        <Heading
          title={actionLabel === "Verify Email" ? "Verify your email" : "Verify your phone number"}
          description={description}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        // eslint-disable-next-line react/no-array-index-key -- fixed-length OTP boxes
                        key={index}
                        index={index}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-3">
          <InfoRow>
            {resendPrompt}
            {" "}
            <button
              type="button"
              onClick={onResend}
              disabled={resendDisabled}
              className="cursor-pointer font-bold text-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendDisabled && cooldownSeconds > 0
                ? `${resendLabel} (${cooldownSeconds}s)`
                : resendLabel}
            </button>
          </InfoRow>
          <InfoRow>
            {changePrompt}
            {" "}
            <button
              type="button"
              onClick={onChangeContact}
              className="cursor-pointer font-bold text-primary-100"
            >
              {changeLabel}
            </button>
          </InfoRow>
        </div>
        <Button
          type="submit"
          disabled={!form.formState.isValid || isVerifying}
          className="h-14 w-full rounded-2xl text-base font-bold"
        >
          {isVerifying ? "Verifying…" : actionLabel}
        </Button>
      </form>
    </Form>
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
  values,
  uploads,
  onEdit,
}: {
  values: OrganizationFormValues;
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
              <dd className="mt-1 text-base">{values[field.key]}</dd>
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

const FALLBACK_TIMELINE: OnboardingApplicationTimelineEntry[] = [
  {
    step: "submitted", label: "Application submitted", complete: true, inProgress: false,
  },
  {
    step: "details", label: "Organization details received", complete: true, inProgress: false,
  },
  {
    step: "documents", label: "Documents received", complete: true, inProgress: false,
  },
  {
    step: "review", label: "Application Review", complete: false, inProgress: true,
  },
];

export function SubmittedStep({
  email,
  timeline,
}: {
  email: string;
  timeline?: OnboardingApplicationTimelineEntry[];
}) {
  const rows = timeline && timeline.length > 0 ? timeline : FALLBACK_TIMELINE;

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
      <h2 className="mt-8 max-w-105 text-3xl font-bold">Application Submitted Successfully</h2>
      <p className="mt-3 max-w-130 text-base text-[#4D4D4D]">
        Your Fleet Pro Application Has Been Received And Is Being Processed. When Your
        Application Is Approved A Setup Link Would Be Sent To
        {" "}
        <span className="font-bold text-foreground">{email}</span>
        .
      </p>
      <ul className="mt-9 w-full space-y-0 rounded-2xl bg-[#FAFAFA] px-7 py-7 text-left">
        {rows.map((row, index) => (
          <li
            key={row.step}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              {row.complete
                ? (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-100">
                      <Check
                        className="size-3.5 text-white"
                        strokeWidth={3.5}
                      />
                    </span>
                  )
                : row.inProgress
                  ? <span className="size-6 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  : <span className="size-6 shrink-0 rounded-full bg-[#EAEAEA]" />}
              {index < rows.length - 1 && (
                <span className={cn(
                  "min-h-6 flex-1",
                  row.complete ? "w-0.5 bg-primary-100" : "border-l-2 border-dashed border-border",
                )}
                />
              )}
            </div>
            <span className="pb-6 text-base">
              {row.label}
              {row.inProgress && (
                <span className="mt-1 block text-sm text-primary-100">In-Progress</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <InfoRow className="mt-7 max-w-[520px] items-start text-sm text-[#4D4D4D]">
        This Process May Take 30 Minutes To 1 Hour. Please Be Patient While We Complete Your
        Request.
      </InfoRow>
    </div>
  );
}
