import type { OnboardingApplication } from "@truckmoov/api/auth";
import type {
  ApplicantCustomerType, RequiredDocument,
} from "@truckmoov/app-core/apply/applyTypes";
import type { ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingM2mPlansQueryOptions,
  getPickupLocationsQueryOptions,
} from "@truckmoov/api/auth";

import { requestedDeviceTotal } from "@truckmoov/app-core/apply/applyTypes";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { ApplicationSaveButton } from "@/features/apply/components/ui/ApplicationSaveButton";
import { applicationToDetails } from "@/features/apply/utils/applySchemas";

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
  const details = applicationToDetails(application);
  const savedFulfilment = application.fulfilment;
  const pickupId = savedFulfilment?.method === "pickup" ? savedFulfilment.pickupLocationId : null;
  const pickup = useQuery(getPickupLocationsQueryOptions()).data?.data.find(location => location.id === pickupId);

  const isEnterprise = customerType === "enterprise";
  const deviceTotal = requestedDeviceTotal(application);
  const documentRows = requiredDocuments.map(document => ({
    key: document.type,
    label: document.label,
    fileName: application.documents.find(item => item.documentType === document.type)?.documentName,
  }));

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
            value={organization.businessEmail}
          />
          <Field
            label="Phone Number"
            value={organization.organizationPhone}
          />
          {isEnterprise && (
            <>
              <Field
                label="Contact Person"
                value={application.contact.fullName}
              />
              <Field
                label="Contact Person Phone"
                value={organization.organizationPhone}
              />
            </>
          )}
          <Field
            label="License Plan"
            value={plan?.name ?? application.m2mPlanCode ?? ""}
          />
          {application.telecomMaster?.numberType && (
            <Field
              label="Telecom Master"
              value={application.telecomMaster.numberType === "existing"
                ? `Existing MTN number +${application.telecomMaster.msisdn ?? ""}`
                : "New Telecom Master SIM (allocation pending)"}
            />
          )}
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Device fulfilment method"
              value="Pickup"
            />
            <Field
              label="Pickup location"
              value={pickup ? `${pickup.name}, ${pickup.area}, ${pickup.state}` : ""}
            />
          </div>
        )}

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
                <span className="truncate text-sm font-medium text-foreground">
                  {request.useCase || "Device request"}
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
                <span className="truncate text-sm font-medium text-foreground">
                  {vehicle.registrationNumber || "Unregistered"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {[
                    vehicle.make,
                    vehicle.model,
                    vehicle.year,
                  ].filter(Boolean).join(" · ") || "-"}
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">{value.trim() ? value : "-"}</p>
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
      <span className="text-sm text-foreground">{label}</span>
      <Badge
        variant="secondary"
        className="rounded-full"
      >
        {count}
      </Badge>
    </div>
  );
}
