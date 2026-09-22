import type {
  OnboardingApplication, OnboardingApplicationDocumentType,
} from "@truckmoov/api/auth";
import type { RequiredDocument } from "@/features/apply/utils/applyTypes";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  useRef, useState,
} from "react";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import { checkFile } from "@/features/apply/utils/applySchemas";
import {
  isUploadable,
  SERVER_DOCUMENT_LABELS,
  toServerDocumentType,
} from "@/features/apply/utils/applyTypes";
import { cn } from "@/lib/utils";

type DocumentsStepProps = {
  required: RequiredDocument[];
  application: OnboardingApplication | undefined;
  /** Server-required types the local list does not name. */
  extraMissing: OnboardingApplicationDocumentType[];
  onUpload: (type: string, file: File) => Promise<void>;
  onRemove: (type: string) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export function DocumentsStep({
  required,
  application,
  extraMissing,
  onUpload,
  onRemove,
  onBack,
  onNext,
  nextLabel,
}: DocumentsStepProps) {
  const [
    errors,
    setErrors,
  ] = useState<Record<string, string>>({});
  const [
    busy,
    setBusy,
  ] = useState<Record<string, boolean>>({});
  const heldDocuments = useApplyDraftStore(state => state.heldDocuments);
  const setHeldDocument = useApplyDraftStore(state => state.setHeldDocument);

  // Anything the server still wants that our own list does not name, shown so the
  // applicant is never blocked by a requirement they were never offered.
  const extraRows: RequiredDocument[] = extraMissing.map(type => ({
    type,
    label: SERVER_DOCUMENT_LABELS[type] ?? type,
    requirement: "Required by the review team.",
  }));

  const rows = [
    ...required,
    ...extraRows,
  ];

  function isPresent(row: RequiredDocument) {
    if (isUploadable(row.type)) {
      const serverType = toServerDocumentType(row.type);
      return Boolean(application?.documents.some(doc => doc.documentType === serverType));
    }
    return Boolean(heldDocuments[row.type]);
  }

  const uploadedCount = rows.filter(isPresent).length;
  const total = rows.length;
  const allPresent = total > 0 && uploadedCount === total;

  async function handleFile(row: RequiredDocument, file: File) {
    const localError = checkFile(
      file,
      row.pdfOnly,
    );
    if (localError) {
      setErrors(previous => ({
        ...previous, [row.type]: localError,
      }));
      return;
    }

    setErrors((previous) => {
      const next = { ...previous };
      delete next[row.type];
      return next;
    });

    // ponytail: no server document type for this one yet — hold the metadata so
    // the applicant can keep going, and mark it clearly as not yet uploaded.
    if (!isUploadable(row.type)) {
      setHeldDocument(
        row.type,
        {
          type: row.type,
          fileName: file.name,
          size: file.size,
        },
      );
      return;
    }

    setBusy(previous => ({
      ...previous, [row.type]: true,
    }));
    try {
      await onUpload(
        row.type,
        file,
      );
    }
    catch (error) {
      setErrors(previous => ({
        ...previous,
        [row.type]: (error as { message?: string }).message ?? "Upload failed. Please try again.",
      }));
    }
    finally {
      setBusy(previous => ({
        ...previous, [row.type]: false,
      }));
    }
  }

  async function handleRemove(row: RequiredDocument) {
    if (!isUploadable(row.type)) {
      setHeldDocument(
        row.type,
        null,
      );
      return;
    }

    setBusy(previous => ({
      ...previous, [row.type]: true,
    }));
    try {
      await onRemove(row.type);
    }
    finally {
      setBusy(previous => ({
        ...previous, [row.type]: false,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Required Documents</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload each document as a PDF file smaller than 10 MB. Files are validated as soon as they
          are added.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {uploadedCount}
            {" of "}
            {total}
            {" documents uploaded"}
          </span>
          {allPresent && (
            <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">
              All documents received
            </Badge>
          )}
        </div>
        <Progress
          value={total === 0 ? 0 : (uploadedCount / total) * 100}
          className="mt-3 h-2"
        />
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <DocumentRow
            key={row.type}
            index={index + 1}
            row={row}
            fileName={
              isUploadable(row.type)
                ? application?.documents.find(
                  doc => doc.documentType === toServerDocumentType(row.type),
                )?.fileName
                : heldDocuments[row.type]?.fileName
            }
            sizeBytes={
              isUploadable(row.type)
                ? application?.documents.find(
                  doc => doc.documentType === toServerDocumentType(row.type),
                )?.sizeBytes
                : heldDocuments[row.type]?.size
            }
            pending={!isUploadable(row.type)}
            busy={Boolean(busy[row.type])}
            error={errors[row.type]}
            onFile={file => handleFile(
              row,
              file,
            )}
            onRemove={() => handleRemove(row)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        Please review your information before submitting your application. Once submitted, your
        application will be reviewed by the Fleet Pro team.
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-6">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="min-w-48"
          disabled={!allPresent}
          onClick={onNext}
        >
          {nextLabel ?? "Next"}
        </Button>
      </div>
    </div>
  );
}

function DocumentRow({
  index,
  row,
  fileName,
  sizeBytes,
  pending,
  busy,
  error,
  onFile,
  onRemove,
}: {
  index: number;
  row: RequiredDocument;
  fileName?: string;
  sizeBytes?: number;
  pending: boolean;
  busy: boolean;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [
    dragging,
    setDragging,
  ] = useState(false);
  const present = Boolean(fileName);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file)
          onFile(file);
      }}
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        error
          ? "border-destructive/50 bg-destructive/5"
          : dragging
            ? "border-primary bg-primary/5"
            : "border-border/70 bg-card/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
              present ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            {present ? <CheckCircle2 className="h-4 w-4" /> : index}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{row.label}</p>
            {row.requirement && (
              <p className="mt-0.5 text-xs text-muted-foreground">{row.requirement}</p>
            )}
            {present && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{fileName}</span>
                {typeof sizeBytes === "number" && (
                  <span className="text-muted-foreground">
                    {`· ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`}
                  </span>
                )}
                {pending && (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-full text-[10px]"
                  >
                    <Clock className="h-3 w-3" />
                    Saved on this device
                  </Badge>
                )}
              </p>
            )}
            {present && pending && (
              <p className="mt-1 text-xs text-muted-foreground">
                This document type is not accepted by the review system yet, so it stays on this
                device until we can send it.
              </p>
            )}
            {error && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                onFile(file);
              event.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy
              ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              : <Upload className="mr-2 h-3.5 w-3.5" />}
            {present ? "Replace" : "Upload"}
          </Button>
          {present && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy}
              aria-label={`Remove ${row.label}`}
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
