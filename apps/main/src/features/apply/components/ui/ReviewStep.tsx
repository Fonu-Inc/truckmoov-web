import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type {
  ApplicantCustomerType, RequiredDocument,
} from "@/features/apply/utils/applyTypes";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  isIndemnitySigned,
  requestedDeviceTotal,
} from "@/features/apply/hooks/useApplySession";

type ReviewStepProps = {
  customerType: ApplicantCustomerType;
  application: OnboardingApplication;
  requiredDocuments: RequiredDocument[];
  submitting: boolean;
  /** From a refused submit: the message, shown above the button. */
  submitError?: string | null;
  submitLabel?: string;
  onBack: () => void;
  onEditDetails: () => void;
  onEditFleet: () => void;
  onEditDocuments: () => void;
  onSubmit: () => void;
};

export function ReviewStep({
  customerType,
  application,
  requiredDocuments,
  submitting,
  submitError,
  submitLabel,
  onBack,
  onEditDetails,
  onEditFleet,
  onEditDocuments,
  onSubmit,
}: ReviewStepProps) {
  const plansQuery = useQuery(getOnboardingM2mPlansQueryOptions());
  const plan = plansQuery.data?.data.plans.find(entry => entry.code === application.m2mPlanCode);
  const { organization } = application;
  const {
    emailVerified, phoneVerified,
  } = application.verification;

  const isEnterprise = customerType === "enterprise";
  const deviceTotal = requestedDeviceTotal(application);
  const documentRows = requiredDocuments.flatMap(document => (
    document.type === "vehicle_license"
      ? application.vehicles.map(vehicle => ({
          key: `vehicle_license:${vehicle.id}`,
          label: `${document.label} — ${vehicle.registrationNumber}`,
          fileName: application.documents.find(item => item.documentType === "vehicle_license" && item.vehicleId === vehicle.id)?.documentName,
        }))
      : [
          {
            key: document.type,
            label: document.label,
            fileName: application.documents.find(item => item.documentType === document.type)?.documentName,
          },
        ]
  ));

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
            value={organization.organizationName}
          />
          <Field
            label={isEnterprise ? "Contact Person" : "Full Name"}
            value={application.contact.fullName}
          />
          <Field
            label="Business Email"
            value={organization.businessEmail}
            badge={emailVerified ? "Verified" : undefined}
          />
          <Field
            label="Phone Number"
            value={organization.organizationPhone}
            badge={phoneVerified ? "Verified" : undefined}
          />
          {isEnterprise
            ? (
                <>
                  <Field
                    label="RC Number"
                    value={application.registry.rcNumber ?? ""}
                  />
                  <Field
                    label="TIN"
                    value={application.registry.taxIdentificationNumber ?? ""}
                  />
                </>
              )
            : (
                <Field
                  label="ID Number"
                  value={application.registry.identificationNumber ?? ""}
                />
              )}
          <Field
            label="License Plan"
            value={plan?.name ?? application.m2mPlanCode ?? ""}
          />
          <Field
            label="Indemnity Form"
            value={isIndemnitySigned(application) ? "Signed" : "Not signed"}
          />
          <Field
            label="Street Address"
            value={organization.streetAddress}
          />
          <Field
            label="City"
            value={organization.city}
          />
          <Field
            label="State"
            value={organization.state}
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
            count={application.vehicles.length}
          />
          <CountRow
            label="Devices requested"
            count={deviceTotal}
          />
        </div>

        {application.deviceRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Devices requested
            </p>
            {application.deviceRequests.map(request => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">
                  {request.useCase}
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

        {application.vehicles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vehicles</p>
            {application.vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">
                  {vehicle.registrationNumber}
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
          {documentRows.map((document) => {
            const fileName = document.fileName;

            return (
              <div
                key={document.key}
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

      {submitError && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{submitError}</p>
      )}

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
