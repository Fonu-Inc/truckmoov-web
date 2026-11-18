"use client";

import type { OnboardingApplication } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type {
  ApplicantCustomerType,
  RequiredDocument,
} from "@/features/get-started/utils/applyTypes";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  InfoRow,
  Notice,
  PassedIcon,
  Pill,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import {
  isIndemnitySigned,
  requestedDeviceTotal,
} from "@/features/get-started/utils/applyHelpers";
import { CARD_CLASS } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

/** Everything saved on the application, read back from the server before submitting (main app: ReviewStep). */
export function ReviewStep({
  customerType,
  application,
  requiredDocuments,
  submitting,
  submitError,
  onBack,
  onEditDetails,
  onEditFleet,
  onEditDocuments,
  onSubmit,
}: {
  customerType: ApplicantCustomerType;
  application: OnboardingApplication;
  requiredDocuments: RequiredDocument[];
  submitting: boolean;
  /** From a refused submit: the message, shown above the button. */
  submitError?: string | null;
  onBack: () => void;
  onEditDetails: () => void;
  onEditFleet: () => void;
  onEditDocuments: () => void;
  onSubmit: () => void;
}) {
  const plansQuery = useQuery(getOnboardingM2mPlansQueryOptions());
  const plan = plansQuery.data?.data.plans.find(entry => entry.code === application.m2mPlanCode);
  const { organization } = application;
  const {
    emailVerified,
    phoneVerified,
  } = application.verification;
  const isEnterprise = customerType === "enterprise";
  const deviceTotal = requestedDeviceTotal(application);
  const documentRows = requiredDocuments.flatMap(document => (
    document.type === "vehicle_license"
      ? application.vehicles.map(vehicle => ({
          key: `vehicle_license:${vehicle.id}`,
          label: `${document.label} (${vehicle.registrationNumber})`,
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
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          continueLabel={submitting ? "Submitting…" : "Submit Application"}
          continueDisabled={submitting}
          onContinue={onSubmit}
        />
      )}
    >
      <StepHeading
        title="Review your application"
        description="Check Everything Below Carefully. You Can Go Back And Edit Any Section Before Submitting."
      />

      <div className="mt-[30px] space-y-4">
        <Section
          title="Customer & Service Details"
          onEdit={onEditDetails}
        >
          <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <Field
              label="Customer Type"
              value={isEnterprise ? "Enterprise Customer" : "Owner Operator"}
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
              verified={emailVerified}
            />
            <Field
              label="Phone Number"
              value={organization.organizationPhone}
              verified={phoneVerified}
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
              label="Address"
              value={[
                organization.streetAddress,
                organization.city,
                organization.state,
              ].filter(Boolean).join(", ")}
            />
          </dl>
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
          {application.vehicles.length > 0 && (
            <ul className="mt-4 space-y-2">
              {application.vehicles.map(vehicle => (
                <li
                  key={vehicle.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border-[0.5px] border-border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-heading">{vehicle.registrationNumber}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {[
                      vehicle.make,
                      vehicle.model,
                      vehicle.year,
                    ].filter(Boolean).join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {application.deviceRequests.length > 0 && (
            <ul className="mt-2 space-y-2">
              {application.deviceRequests.map(request => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border-[0.5px] border-border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-heading">{request.useCase}</span>
                  <Pill>{`${request.quantity} device${request.quantity === 1 ? "" : "s"}`}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Required Documents"
          onEdit={onEditDocuments}
        >
          <ul className="space-y-[17px]">
            {documentRows.map(document => (
              <li
                key={document.key}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-heading">{document.label}</span>
                {document.fileName
                  ? (
                      <span className="flex min-w-0 shrink-0 items-center gap-1.5">
                        <span className="max-w-[10rem] truncate text-xs text-muted-foreground">{document.fileName}</span>
                        <PassedIcon className="size-[18px]" />
                      </span>
                    )
                  : <Pill tone="warning">Not uploaded</Pill>}
              </li>
            ))}
          </ul>
        </Section>

        {submitError && <Notice>{submitError}</Notice>}

        <InfoRow className="text-xs text-muted-foreground">
          By submitting, you confirm the information above is accurate. Once submitted, your
          application will be reviewed by the Fleet Pro team.
        </InfoRow>
      </div>
    </StepLayout>
  );
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className={CARD_CLASS}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base leading-5 font-semibold text-heading">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex cursor-pointer items-center gap-1.5 rounded-[10px] px-2 py-1 text-xs font-medium text-brand-deep hover:bg-surface"
        >
          <PencilSimple className="size-3.5" />
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  verified,
}: {
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn(
        "mt-0.5 flex items-center gap-2 text-sm font-medium text-heading",
      )}
      >
        <span className="truncate">{value || "—"}</span>
        {verified && <Pill tone="success">Verified</Pill>}
      </dd>
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
    <div className="flex items-center justify-between rounded-[12px] bg-surface px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-heading">{count}</span>
    </div>
  );
}
