import type {
  OnboardingApplication,
  OnboardingApplicationDocument,
  OnboardingIdentificationType,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { RequiredDocument } from "@truckmoov/app-core/apply/applyTypes";

import {
  useDeleteOnboardingApplicationDocument,
  useUpdateOnboardingApplication,
  useUploadOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { ApplicationSaveButton } from "@/features/apply/components/ui/ApplicationSaveButton";
import {
  applicationToDetails,
  checkFile,
  describeClaims,
  detailsToPayload,
} from "@/features/apply/utils/applySchemas";
import { cn } from "@/lib/utils";

type DocumentsStepProps = {
  application: OnboardingApplication;
  /** The applicant's list (`documentsForApplicant`). Vehicle licences go in with each vehicle. */
  required: RequiredDocument[];
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

type Slot = {
  key: string;
  document: RequiredDocument;
};

/** The only identification cards accepted, as the design lists them; saved as `identificationType`. */
const ID_CARD_TYPES: Array<{
  value: OnboardingIdentificationType;
  label: string;
}> = [
  {
    value: "nin",
    label: "National Identification Card",
  },
  {
    value: "drivers_licence",
    label: "Driver's License",
  },
];

const ID_TYPE_REQUIRED = "Select your identification card type first. Only a National Identification Card or Driver's License is accepted. Any other card will be rejected.";

function uploadError(error: unknown) {
  const err = error as ServerErrorResponse;
  if (err.statusCode === 413)
    return "This file is larger than 10 MB. Please upload a smaller PDF file.";
  return describeClaims(err.claimTypes)
    ?? err.message
    ?? "Upload a PDF file.";
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
  const updateApplication = useUpdateOnboardingApplication();
  const savedIdType = application.registry.identificationType;
  const [
    idType,
    setIdType,
  ] = useState<string>(savedIdType === "nin" || savedIdType === "drivers_licence" ? savedIdType : "");

  /** PATCH replaces the details, so the application's own are resent with the ID type. */
  async function saveIdType(value: string) {
    setIdType(value);
    setRow(
      setErrors,
      "identification_card",
    );
    try {
      await updateApplication.mutateAsync({
        id: application.id,
        data: {
          ...detailsToPayload(
            applicationToDetails(application),
            application.applicantType,
            application.m2mPlanCode ?? "",
            application.returningCustomer,
          ),
          identificationType: value as OnboardingIdentificationType,
        },
      });
    }
    catch (error) {
      setRow(
        setErrors,
        "identification_card",
        (error as ServerErrorResponse).message || "Your ID type couldn't be saved. Try again.",
      );
    }
  }

  const slots: Slot[] = required.map(document => ({
    key: document.type,
    document,
  }));

  function filed(slot: Slot): OnboardingApplicationDocument | undefined {
    return application.documents.find(item => item.documentType === slot.document.type);
  }

  const uploadedCount = slots.filter(slot => filed(slot)).length;
  const total = slots.length;
  const allPresent = total > 0 && uploadedCount === total;

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
    // The design takes PDFs only, and asks which ID card it is before the upload.
    const localError = slot.document.type === "identification_card" && !idType
      ? ID_TYPE_REQUIRED
      : checkFile(
          file,
          true,
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

        file,
      });
    }
    catch (error) {
      setRow(
        setErrors,
        slot.key,
        uploadError(error),
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
        {slots.map((slot, index) => {
          const document = filed(slot);
          return (
            <DocumentRow
              key={slot.key}
              index={index + 1}
              label={slot.document.label}
              requirement={slot.document.requirement}
              idType={slot.document.type === "identification_card" ? idType : undefined}
              onIdType={value => void saveIdType(value)}
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

      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        Please review your information before submitting your application. Once submitted, your
        application will be reviewed by the Fleet Pro team.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ApplicationSaveButton />
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
  idType,
  onIdType,
  document,
  busy,
  error,
  onFile,
  onRemove,
}: {
  index: number;
  label: string;
  requirement?: string;
  /** Set on the identification card row: the card type picked in the design's select. */
  idType?: string;
  onIdType?: (value: string) => void;
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
            {idType !== undefined && (
              <div className="mt-2 max-w-64">
                <Select
                  value={idType}
                  onValueChange={value => onIdType?.(value)}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_CARD_TYPES.map(type => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
