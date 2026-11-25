"use client";

import type {
  OnboardingApplication,
  OnboardingApplicationDocument,
  OnboardingIdentificationType,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { RequiredDocument } from "@truckmoov/app-core/apply/applyTypes";
import type { DraftFile } from "@/features/get-started/utils/draftFiles";
import {
  useDeleteOnboardingApplicationDocument,
  useUpdateOnboardingApplication,
  useUploadOnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import {
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  Pill,
  ProgressBar,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { UploadField } from "@/features/get-started/components/UploadField";
import {
  applicationToDetails,
  checkFile,
  describeClaims,
  detailsToPayload,
} from "@/features/get-started/schemas/applySchemas";
import {
  deleteDraftFile,
  listDraftFiles,
  putDraftFile,
} from "@/features/get-started/utils/draftFiles";
import {
  CARD_CLASS,
  FIELD_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

type Slot = {
  key: string;
  document: RequiredDocument;
};

/** A file picked for a slot that never reached the server, kept in IndexedDB. */
type PendingUpload = {
  file: File;
  error: string;
};

const PENDING_PREFIX = "doc:";

/** The only identification cards accepted, as the design lists them. */
/** The design accepts these two; saved as the application's `identificationType`. */
const ID_CARD_TYPES: Array<{
  value: OnboardingIdentificationType; label: string;
}> = [
  {
    value: "nin", label: "National Identification Card",
  },
  {
    value: "drivers_licence", label: "Driver's License",
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
 * Required documents (main app: DocumentsStep). The list depends on the customer type (a
 * returning MTN customer owes only the Customer Request Letter); what is filed comes from
 * the server. Every document is a PDF. A failed
 * upload is kept in IndexedDB so an applicant who comes back can retry it without finding
 * the file again. The signed indemnity form is generated at signing and never uploaded here.
 */
export function DocumentsStep({
  application,
  required,
  onBack,
  onNext,
}: {
  application: OnboardingApplication;
  /** The per-type list (`documentsForApplicant`). */
  required: RequiredDocument[];
  onBack: () => void;
  onNext: () => void;
}) {
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
  const [
    pending,
    setPending,
  ] = useState<Record<string, PendingUpload>>({});
  const updateApplication = useUpdateOnboardingApplication();
  const savedIdType = application.registry.identificationType;
  const [
    idType,
    setIdType,
  ] = useState<string>(savedIdType === "nin" || savedIdType === "drivers_licence" ? savedIdType : "");

  /** PATCH replaces the details, so the application's own are resent with the ID type. */
  async function saveIdType(value: string) {
    setIdType(value);
    if (!value)
      return;
    const details = detailsToPayload(
      applicationToDetails(application),
      application.applicantType,
      application.m2mPlanCode ?? "",
      application.returningCustomer,
    );
    try {
      await updateApplication.mutateAsync({
        id: application.id,
        data: {
          ...details,
          identificationType: value as OnboardingIdentificationType,
        },
      });
    }
    catch (error) {
      setRow(
        setErrors,
        "identification_card",
        (error as { message?: string }).message || "Your ID type couldn't be saved. Try again.",
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

  // Reads the latest documents without re-running the restore when they change: later
  // uploads keep `pending` in step themselves.
  const restorePending = useEffectEvent((saved: DraftFile[]) => {
    const restored: Record<string, PendingUpload> = {};
    for (const entry of saved) {
      const key = entry.key.slice(PENDING_PREFIX.length);
      const alreadyFiled = application.documents.some(item => item.documentType === key);
      if (alreadyFiled) {
        void deleteDraftFile(entry.key);
        continue;
      }
      restored[key] = {
        file: new File(
          [entry.blob],
          entry.meta.name ?? "document",
          { type: entry.meta.type ?? entry.blob.type },
        ),
        error: entry.meta.error ?? "This file wasn't uploaded. Retry to send it.",
      };
    }
    setPending(restored);
  });

  // Bring back uploads that failed on an earlier visit; drop any the server now has.
  useEffect(
    () => {
      let cancelled = false;
      void listDraftFiles(PENDING_PREFIX).then((saved) => {
        if (!cancelled)
          restorePending(saved);
      });
      return () => {
        cancelled = true;
      };
    },
    [],
  );

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
      setRow(
        setPending,
        slot.key,
      );
      void deleteDraftFile(`${PENDING_PREFIX}${slot.key}`);
    }
    catch (error) {
      const message = uploadError(error);
      const status = (error as ServerErrorResponse).statusCode;
      // A file the server refused (bad format, duplicate) won't succeed on retry; only keep
      // the ones lost to the network or a server hiccup.
      if (!status || status >= 500) {
        setRow(
          setPending,
          slot.key,
          {
            file,
            error: message,
          },
        );
        void putDraftFile({
          key: `${PENDING_PREFIX}${slot.key}`,
          blob: file,
          meta: {
            name: file.name,
            type: file.type,
            error: message,
          },
        });
      }
      else {
        setRow(
          setErrors,
          slot.key,
          message,
        );
      }
    }
    finally {
      setRow(
        setBusy,
        slot.key,
      );
    }
  }

  async function handleRemove(slot: Slot, document?: OnboardingApplicationDocument) {
    if (!document) {
      setRow(
        setPending,
        slot.key,
      );
      void deleteDraftFile(`${PENDING_PREFIX}${slot.key}`);
      return;
    }
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
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          continueLabel="Next"
          continueDisabled={!allPresent}
          onContinue={onNext}
        />
      )}
    >
      <StepHeading
        title="Required Documents"
        description="All requested documents are mandatory. Upload each document as a PDF file smaller than 10 MB. Files are validated as soon as they are added."
      />

      <div className={cn(
        CARD_CLASS,
        "mt-[30px] space-y-3",
      )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-heading">{`${uploadedCount} of ${total} documents uploaded`}</span>
          {allPresent && <Pill tone="success">All documents received</Pill>}
        </div>
        <ProgressBar value={total === 0 ? 0 : (uploadedCount / total) * 100} />
      </div>

      <div className="mt-[25px] space-y-[18px]">
        {slots.map((slot) => {
          const document = filed(slot);
          const unsent = document ? undefined : pending[slot.key];
          return (
            <UploadField
              key={slot.key}
              title={`${slot.document.label} (Required)`}
              description={document?.rejectionReason ?? slot.document.requirement}
              fileName={document?.documentName ?? unsent?.file.name}
              status={document ? (document.status === "rejected" ? "rejected" : "uploaded") : unsent ? "pending" : null}
              error={errors[slot.key] ?? unsent?.error}
              busy={Boolean(busy[slot.key])}
              pdfOnly
              onSelect={file => void handleFile(
                slot,
                file,
              )}
              onRetry={unsent
                ? () => void handleFile(
                    slot,
                    unsent.file,
                  )
                : undefined}
              onRemove={document || unsent
                ? () => void handleRemove(
                    slot,
                    document,
                  )
                : undefined}
            >
              {slot.document.type === "identification_card" && (
                <select
                  aria-label="Identification card type"
                  value={idType}
                  onChange={(event) => {
                    setRow(
                      setErrors,
                      slot.key,
                    );
                    void saveIdType(event.target.value);
                  }}
                  className={cn(
                    FIELD_CLASS,
                    "mt-3 h-10 max-w-64 text-xs",
                    !idType && "text-faint-foreground",
                  )}
                >
                  <option value="">Select ID type</option>
                  {ID_CARD_TYPES.map(type => (
                    <option
                      key={type.value}
                      value={type.value}
                      className="text-heading"
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
            </UploadField>
          );
        })}

      </div>

      <p className="mt-[25px] rounded-[15px] bg-surface p-4 text-xs leading-[17px] text-muted-foreground">
        Please review your information before submitting your application. Once submitted, your
        application will be reviewed by the Fleet Pro team.
      </p>
    </StepLayout>
  );
}
