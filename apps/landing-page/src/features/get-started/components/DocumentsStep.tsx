"use client";

import type {
  OnboardingApplication,
  OnboardingApplicationDocument,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { RequiredDocument } from "@/features/get-started/utils/applyTypes";
import type { DraftFile } from "@/features/get-started/utils/draftFiles";
import { Signature } from "@phosphor-icons/react/dist/ssr";
import {
  useDeleteOnboardingApplicationDocument,
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
  checkFile,
  describeClaims,
} from "@/features/get-started/schemas/applySchemas";
import { isIndemnitySigned } from "@/features/get-started/utils/applyHelpers";
import {
  deleteDraftFile,
  listDraftFiles,
  putDraftFile,
} from "@/features/get-started/utils/draftFiles";
import {
  CARD_CLASS,
  LINK_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

type Slot = {
  key: string;
  document: RequiredDocument;
  /** Set on a `vehicle_license` slot. */
  vehicle?: {
    id: string;
    registrationNumber: string;
  };
};

/** A file picked for a slot that never reached the server, kept in IndexedDB. */
type PendingUpload = {
  file: File;
  error: string;
};

const PENDING_PREFIX = "doc:";

function uploadError(error: unknown, pdfOnly?: boolean) {
  const err = error as ServerErrorResponse;
  if (err.statusCode === 413)
    return "This file is larger than 10 MB. Please upload a smaller file.";
  return describeClaims(err.claimTypes)
    ?? err.message
    ?? (pdfOnly ? "Upload a PDF file." : "The file couldn't be uploaded.");
}

/**
 * Required documents (main app: DocumentsStep). The list depends on the customer type, with
 * a licence per vehicle; what is filed and what is missing come from the server. A failed
 * upload is kept in IndexedDB so a returning applicant can retry it without finding the
 * file again. The signed indemnity form is generated at signing and never uploaded here.
 */
export function DocumentsStep({
  application,
  required,
  onBack,
  onNext,
}: {
  application: OnboardingApplication;
  /** The per-type list; `vehicle_license` is expanded to one slot per vehicle. */
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

  // Reads the latest documents without re-running the restore when they change: later
  // uploads keep `pending` in step themselves.
  const restorePending = useEffectEvent((saved: DraftFile[]) => {
    const restored: Record<string, PendingUpload> = {};
    for (const entry of saved) {
      const key = entry.key.slice(PENDING_PREFIX.length);
      const alreadyFiled = application.documents.some(item => (key.startsWith("vehicle_license:")
        ? item.documentType === "vehicle_license" && `vehicle_license:${item.vehicleId}` === key
        : item.documentType === key));
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
      setRow(
        setPending,
        slot.key,
      );
      void deleteDraftFile(`${PENDING_PREFIX}${slot.key}`);
    }
    catch (error) {
      const message = uploadError(
        error,
        slot.document.pdfOnly,
      );
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
          continueLabel="Review Application"
          continueDisabled={!allPresent}
          onContinue={onNext}
        />
      )}
    >
      <StepHeading
        title="Required Documents"
        description="Upload Each Document As A PDF, JPG Or PNG Smaller Than 10 MB. The Customer Request Letter Must Be A PDF."
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
        {missingLicences.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {"Still needs a vehicle licence: "}
            <span className="font-medium text-heading">{missingLicences.map(item => item.registrationNumber).join(", ")}</span>
          </p>
        )}
      </div>

      <div className="mt-[25px] space-y-[18px]">
        {slots.map((slot) => {
          const document = filed(slot);
          const unsent = document ? undefined : pending[slot.key];
          return (
            <UploadField
              key={slot.key}
              title={slot.vehicle ? `${slot.document.label} (${slot.vehicle.registrationNumber})` : slot.document.label}
              description={document?.rejectionReason ?? (slot.vehicle ? "A valid licence for this vehicle." : slot.document.requirement)}
              fileName={document?.documentName ?? unsent?.file.name}
              status={document ? (document.status === "rejected" ? "rejected" : "uploaded") : unsent ? "pending" : null}
              error={errors[slot.key] ?? unsent?.error}
              busy={Boolean(busy[slot.key])}
              pdfOnly={slot.document.pdfOnly}
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
            />
          );
        })}

        {needsVehicles && (
          <p className="rounded-[20px] border border-dashed border-border-field p-4 text-sm text-muted-foreground">
            Vehicle licences are uploaded per vehicle.
            {" "}
            <button
              type="button"
              className={LINK_CLASS}
              onClick={onBack}
            >
              Add your vehicles in Fleet Requirements
            </button>
            {" "}
            first.
          </p>
        )}

        <div className={cn(
          CARD_CLASS,
          "flex items-center gap-3",
        )}
        >
          <span className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[12px]",
            signed ? "bg-success-soft text-success-deep" : "bg-surface text-muted-foreground",
          )}
          >
            <Signature className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-heading">Signed Indemnity Form</p>
            <p className="text-xs text-muted-foreground">
              {signed
                ? "Generated when you signed the agreement. Nothing to upload."
                : "Created when you sign the agreement on the Customer Details step."}
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
