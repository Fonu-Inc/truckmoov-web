import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type {
  ApplicantCustomerType, RequiredDocument,
} from "@/features/apply/utils/applyTypes";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  isUploadable,
  toServerDocumentType,
} from "@/features/apply/utils/applyTypes";
import { findM2MPlan } from "@/features/apply/utils/m2mLicense";

type ReviewStepProps = {
  customerType: ApplicantCustomerType;
  details: BusinessDetailsValues;
  application: OnboardingApplication | undefined;
  requiredDocuments: RequiredDocument[];
  submitting: boolean;
  submitLabel?: string;
  onBack: () => void;
  onEditDetails: () => void;
  onEditFleet: () => void;
  onEditDocuments: () => void;
  onSubmit: () => void;
};

export function ReviewStep({
  customerType,
  details,
  application,
  requiredDocuments,
  submitting,
  submitLabel,
  onBack,
  onEditDetails,
  onEditFleet,
  onEditDocuments,
  onSubmit,
}: ReviewStepProps) {
  const fleet = useApplyDraftStore(state => state.fleet);
  const licence = useApplyDraftStore(state => state.licence);
  const heldDocuments = useApplyDraftStore(state => state.heldDocuments);

  const isEnterprise = customerType === "enterprise";
  const deviceTotal = fleet.deviceRequests.reduce(
    (total, request) => total + request.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Review your application before submitting
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check everything below carefully. You can go back and edit any section before submitting.
        </p>
      </div>

      <Section
        title="Customer & Service Details"
        onEdit={onEditDetails}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Customer Type"
            value={isEnterprise
              ? "Fleet Provider (more than 10 vehicles)"
              : "Owner-Operator (10 vehicles or fewer)"}
          />
          <Field
            label="Organization Name"
            value={details.organizationName}
          />
          {!isEnterprise && (
            <>
              <Field
                label="First Name"
                value={details.firstName}
              />
              <Field
                label="Last Name"
                value={details.lastName}
              />
            </>
          )}
          <Field
            label="Business Email"
            value={details.businessEmail}
            badge={application?.emailVerified ? "Verified" : undefined}
          />
          <Field
            label="Phone Number"
            value={details.phoneNumber}
            badge={application?.phoneVerified ? "Verified" : undefined}
          />
          {isEnterprise && (
            <Field
              label="Contact Person"
              value={details.contactName}
            />
          )}
          <Field
            label="License Plan"
            value={findM2MPlan(licence.licensePlan)?.label ?? ""}
          />
          <Field
            label="Indemnity Form"
            value={licence.indemnitySigned ? "Signed" : "Not signed"}
          />
          <Field
            label="Street Address"
            value={details.streetAddress}
          />
          <Field
            label="City"
            value={details.city}
          />
          <Field
            label="State"
            value={details.state ?? ""}
          />
        </div>
      </Section>

      <Section
        title="Fleet Requirements"
        onEdit={onEditFleet}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <CountRow
            label="Vehicles added"
            count={fleet.vehicles.length}
          />
          <CountRow
            label="Devices requested"
            count={deviceTotal}
          />
        </div>

        {fleet.deviceRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Devices requested
            </p>
            {fleet.deviceRequests.map(request => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">
                  {request.manufacturer || "Device"}
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-full"
                >
                  {request.quantity}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {fleet.vehicles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vehicles</p>
            {fleet.vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">
                  {vehicle.registrationNumber || "Unregistered"}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {[
                    vehicle.make,
                    vehicle.model,
                    vehicle.year,
                  ].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Required Documents"
        onEdit={onEditDocuments}
      >
        <div className="space-y-2">
          {requiredDocuments.map((document) => {
            const serverDocument = isUploadable(document.type)
              ? application?.documents.find(
                  item => item.documentType === toServerDocumentType(document.type),
                )
              : undefined;
            const held = !isUploadable(document.type) ? heldDocuments[document.type] : undefined;
            const fileName = serverDocument?.fileName ?? held?.fileName;

            return (
              <div
                key={document.type}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">{document.label}</span>
                </span>
                {fileName
                  ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="max-w-[10rem] truncate">{fileName}</span>
                      </span>
                    )
                  : (
                      <span className="shrink-0 text-xs text-muted-foreground">Not uploaded</span>
                    )}
              </div>
            );
          })}
        </div>
      </Section>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
        By submitting, you confirm the information above is accurate. Once submitted, your
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
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting ? "Submitting…" : (submitLabel ?? "Submit Application")}
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onEdit}
          >
            <Pencil className="mr-1.5 h-3 w-3" />
            Edit
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
        {value || "—"}
        {badge && (
          <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">
            {badge}
          </Badge>
        )}
      </p>
    </div>
  );
}

function CountRow({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge
        variant="secondary"
        className="rounded-full"
      >
        {count}
      </Badge>
    </div>
  );
}
