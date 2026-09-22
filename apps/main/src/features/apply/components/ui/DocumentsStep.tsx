import type { RequiredDocument } from "@/features/apply/utils/applyTypes";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
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
import { cn } from "@/lib/utils";

type DocumentsStepProps = {
  required: RequiredDocument[];
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export function DocumentsStep({
  required,
  onBack,
  onNext,
  nextLabel,
}: DocumentsStepProps) {
  const [
    errors,
    setErrors,
  ] = useState<Record<string, string>>({});
  const heldDocuments = useApplyDraftStore(state => state.heldDocuments);
  const setHeldDocument = useApplyDraftStore(state => state.setHeldDocument);

  function isPresent(row: RequiredDocument) {
    return Boolean(heldDocuments[row.type]);
  }

  const uploadedCount = required.filter(isPresent).length;
  const total = required.length;
  const allPresent = total > 0 && uploadedCount === total;

  function handleFile(row: RequiredDocument, file: File) {
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

    setHeldDocument(
      row.type,
      {
        type: row.type,
        fileName: file.name,
        size: file.size,
      },
    );
  }

  function handleRemove(row: RequiredDocument) {
    setHeldDocument(
      row.type,
      null,
    );
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
        {required.map((row, index) => (
          <DocumentRow
            key={row.type}
            index={index + 1}
            row={row}
            fileName={heldDocuments[row.type]?.fileName}
            sizeBytes={heldDocuments[row.type]?.size}
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
  error,
  onFile,
  onRemove,
}: {
  index: number;
  row: RequiredDocument;
  fileName?: string;
  sizeBytes?: number;
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
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full text-[10px]"
                >
                  <Clock className="h-3 w-3" />
                  Saved on this device
                </Badge>
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
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            {present ? "Replace" : "Upload"}
          </Button>
          {present && (
            <Button
              variant="ghost"
              size="icon-sm"
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
