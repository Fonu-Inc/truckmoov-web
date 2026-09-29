import type {
  OnboardingApplication,
  OnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { RequiredDocument } from "@/features/apply/utils/applyTypes";

import {
  useDeleteOnboardingApplicationDocument,
  useUploadOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSignature,
  FileText,
  Upload,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import { isIndemnitySigned } from "@/features/apply/hooks/useApplySession";
import {
  checkFile,
  describeClaims,
} from "@/features/apply/utils/applySchemas";
import { cn } from "@/lib/utils";

type DocumentsStepProps = {
  application: OnboardingApplication;
  /** The per-role list; `vehicle_license` is expanded to one slot per vehicle. */
  required: RequiredDocument[];
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

type Slot = {
  key: string;
  document: RequiredDocument;
  /** Set on a `vehicle_license` slot. */
  vehicle?: {
    id: string; registrationNumber: string;
  };
};

function uploadError(error: unknown, pdfOnly?: boolean) {
  const err = error as ServerErrorResponse;
  if (err.statusCode === 413)
    return "This file is larger than 10 MB. Please upload a smaller file.";
  return describeClaims(err.claimTypes)
    ?? err.message
    ?? (pdfOnly ? "Upload a PDF file." : "The file couldn't be uploaded.");
}

/**
 * Step 3 (TRU-FE-13). The list depends on the customer type picked in step 1, with a
 * licence per vehicle. What is filed and what is missing both come from the server.
 * The signed indemnity form is generated at signing and never uploaded here.
 */
export function DocumentsStep({
  application,
  required,
  onBack,
  onNext,
  nextLabel,
}: DocumentsStepProps) {
  const upload = useUploadOnboardingApplicationDocument();
  const remove = useDeleteOnboardingApplicationDocument();
  const [
    errors,
    setErrors,
  ] = useState<Record<string, string>>({});
  const [
    busy,
    setBusy,
  ] = useState<Record<string, boolean>>({});

  const slots: Slot[] = required.flatMap<Slot>(document => (
    document.type === "vehicle_license"
      ? application.vehicles.map(vehicle => ({
          key: `vehicle_license:${vehicle.id}`,
          document,
          vehicle: {
            id: vehicle.id,
            registrationNumber: vehicle.registrationNumber,
          },
        }))
      : [
          {
            key: document.type,
            document,
          },
        ]
  ));

  function filed(slot: Slot): OnboardingApplicationDocument | undefined {
    return application.documents.find(item => item.documentType === slot.document.type
      && (slot.vehicle ? item.vehicleId === slot.vehicle.id : true));
  }

  const uploadedCount = slots.filter(slot => filed(slot)).length;
  const total = slots.length;
  const needsVehicles = required.some(document => document.type === "vehicle_license") && application.vehicles.length === 0;
  const missingLicences = application.vehiclesMissingDocuments.filter(item => item.documentType === "vehicle_license");
  const allPresent = total > 0 && uploadedCount === total && !needsVehicles;
  const signed = isIndemnitySigned(application);

  function setRow<T>(setter: (update: (previous: Record<string, T>) => Record<string, T>) => void, key: string, value?: T) {
    setter((previous) => {
      const next = { ...previous };
      if (value === undefined)
        delete next[key];
      else
        next[key] = value;
      return next;
    });
  }

  async function handleFile(slot: Slot, file: File) {
    const localError = checkFile(
      file,
      slot.document.pdfOnly,
    );
    if (localError) {
      setRow(
        setErrors,
        slot.key,
        localError,
      );
      return;
    }
    setRow(
      setErrors,
      slot.key,
    );
    setRow(
      setBusy,
      slot.key,
      true,
    );
    try {
      // Uploading the same type again replaces the previous file.
      await upload.mutateAsync({
        id: application.id,
        documentType: slot.document.type,
        vehicleId: slot.vehicle?.id,
        file,
      });
    }
    catch (error) {
      setRow(
        setErrors,
        slot.key,
        uploadError(
          error,
          slot.document.pdfOnly,
        ),
      );
    }
    finally {
      setRow(
        setBusy,
        slot.key,
      );
    }
  }

  async function handleRemove(slot: Slot, document: OnboardingApplicationDocument) {
    setRow(
      setBusy,
      slot.key,
      true,
    );
    try {
      await remove.mutateAsync({
        id: application.id,
        documentId: document.id,
      });
      setRow(
        setErrors,
        slot.key,
      );
    }
    catch (error) {
      setRow(
        setErrors,
        slot.key,
        (error as ServerErrorResponse).message || "The document couldn't be removed.",
      );
    }
    finally {
      setRow(
        setBusy,
        slot.key,
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Required Documents</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload each document as a PDF, JPG or PNG smaller than 10 MB. The Customer Request Letter
          must be a PDF.
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
        {missingLicences.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {"Still needs a vehicle licence: "}
            <span className="font-medium text-foreground">
              {missingLicences.map(item => item.registrationNumber).join(", ")}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-3">
        {slots.map((slot, index) => {
          const document = filed(slot);
          return (
            <DocumentRow
              key={slot.key}
              index={index + 1}
              label={slot.vehicle ? `${slot.document.label} — ${slot.vehicle.registrationNumber}` : slot.document.label}
              requirement={slot.vehicle ? "A valid licence for this vehicle." : slot.document.requirement}
              pdfOnly={slot.document.pdfOnly}
              document={document}
              busy={Boolean(busy[slot.key])}
              error={errors[slot.key]}
              onFile={file => void handleFile(
                slot,
                file,
              )}
              onRemove={() => document && void handleRemove(
                slot,
                document,
              )}
            />
          );
        })}

        {needsVehicles && (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Vehicle licences are uploaded per vehicle.
            {" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={onBack}
            >
              Add your vehicles in Fleet Requirements
            </button>
            {" "}
            first.
          </div>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/40 p-4">
          <span className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            signed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
          >
            <FileSignature className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Signed Indemnity Form</p>
            <p className="text-xs text-muted-foreground">
              {signed
                ? "Generated when you signed the agreement — nothing to upload."
                : "Created when you sign the agreement on the Customer Details step."}
            </p>
          </div>
        </div>
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
  label,
  requirement,
  pdfOnly,
  document,
  busy,
  error,
  onFile,
  onRemove,
}: {
  index: number;
  label: string;
  requirement?: string;
  pdfOnly?: boolean;
  document?: OnboardingApplicationDocument;
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
  const present = Boolean(document);

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
        if (file && !busy)
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
            <p className="text-sm font-medium text-foreground">{label}</p>
            {requirement && (
              <p className="mt-0.5 text-xs text-muted-foreground">{requirement}</p>
            )}
            {document && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{document.documentName}</span>
                <span className="text-muted-foreground">
                  {`· ${(document.fileSize / 1024 / 1024).toFixed(2)} MB`}
                </span>
                {document.status === "rejected" && (
                  <Badge
                    variant="destructive"
                    className="rounded-full text-[10px]"
                  >
                    Rejected
                  </Badge>
                )}
              </p>
            )}
            {document?.rejectionReason && (
              <p className="mt-1 text-xs text-destructive">{document.rejectionReason}</p>
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
            accept={pdfOnly ? "application/pdf,.pdf" : "application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png"}
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
            loading={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            {present ? "Replace" : "Upload"}
          </Button>
          {present && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${label}`}
              disabled={busy}
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
